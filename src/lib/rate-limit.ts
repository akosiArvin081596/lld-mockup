import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

/**
 * In-memory sliding-window rate limiter.
 *
 * This is deliberate and sufficient for this site: it runs as ONE Node process on one VPS.
 * The counts live in this process only, so they reset on restart and are not shared between
 * instances. If the app is ever run with more than one instance, move this to Redis or similar.
 *
 * Memory is bounded: at most MAX_KEYS buckets exist at once (fixed server-chosen keys aside). Once the map is full, a key it has
 * not seen before is reported as limited (fail closed) until the sweep frees space.
 */

/** Hard cap on tracked keys. Roughly a few MB at worst (each bucket holds at most `limit` timestamps). */
export const MAX_KEYS = 50_000;
/** Regular expiry sweep interval. */
const SWEEP_EVERY_MS = 60_000;
/** When the map is full, an early sweep is allowed at most this often, so a flood cannot make every request O(MAX_KEYS). */
const FULL_SWEEP_EVERY_MS = 5_000;

interface Bucket {
  hits: number[];
  /** Each bucket remembers its own window, so a sweep never drops a longer-window bucket (e.g. the global cap) early. */
  windowMs: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  /**
   * For a fixed, server-chosen key (such as "contact:global" or "contact:direct"): it may be created
   * even when the map is full. Never set this for a key derived from request data.
   */
  fixedKey?: boolean;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the oldest counted request leaves the window. */
  retryAfterSec: number;
}

/** Count one request for `key` and report whether it is within the limit. */
export function rateLimit(key: string, { limit, windowMs, fixedKey = false }: RateLimitOptions, now = Date.now()): RateLimitResult {
  sweep(now, SWEEP_EVERY_MS);

  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= MAX_KEYS && !fixedKey) {
      sweep(now, FULL_SWEEP_EVERY_MS);
      if (buckets.size >= MAX_KEYS) {
        return { ok: false, remaining: 0, retryAfterSec: Math.ceil(SWEEP_EVERY_MS / 1000) };
      }
    }
    bucket = { hits: [], windowMs };
    buckets.set(key, bucket);
  }

  const since = now - windowMs;
  bucket.windowMs = windowMs;
  bucket.hits = bucket.hits.filter((t) => t > since);

  if (bucket.hits.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.hits[0] + windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryAfterSec };
  }

  bucket.hits.push(now);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSec: 0 };
}

/** Drop buckets whose every hit has left that bucket's own window. Runs at most once per `everyMs`. */
function sweep(now: number, everyMs: number) {
  if (now - lastSweep < everyMs) return;
  lastSweep = now;
  for (const [key, { hits, windowMs }] of buckets) {
    const since = now - windowMs;
    if (hits.every((t) => t <= since)) buckets.delete(key);
  }
}

/** Shared bucket for every request whose origin IP cannot be trusted. */
export const DIRECT_KEY = "direct";

/** Constant-time string comparison (hashing first makes the lengths equal, so length is not leaked either). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** The placeholder shipped in deploy/nginx.conf.example. It is public, so it proves nothing. */
const PLACEHOLDER_SECRET = "CHANGE-ME-proxy-secret";
const MIN_SECRET_LENGTH = 32;
let secretChecked = false;
let lastMismatchLog = 0;

/** In production, log ONE error per process if PROXY_SECRET is missing or weak. Never logs the value. */
function checkSecretOnce(secret: string | undefined) {
  if (secretChecked || process.env.NODE_ENV !== "production") return;
  secretChecked = true;
  const problem = !secret
    ? "is not set, so every visitor shares one rate-limit bucket"
    : secret === PLACEHOLDER_SECRET
      ? "is still the public placeholder from nginx.conf.example"
      : secret.length < MIN_SECRET_LENGTH
        ? `is shorter than ${MIN_SECRET_LENGTH} characters`
        : null;
  if (problem) {
    console.error(`[contact] PROXY_SECRET ${problem}. Set a random value (e.g. openssl rand -hex 32) in the env and the Nginx X-LLD-Proxy header.`);
  }
}

/** A wrong X-LLD-Proxy means a misconfigured proxy or a forging client. Logged at most once a minute, without the header value or IP. */
function logMismatch(now = Date.now()) {
  if (now - lastMismatchLog < 60_000) return;
  lastMismatchLog = now;
  console.error("[contact] X-LLD-Proxy header did not match PROXY_SECRET; request treated as direct (logged at most once a minute).");
}

/**
 * Normalize a validated IP into a bucket id. IPv4 (and IPv4-mapped IPv6) is used as is.
 * IPv6 is grouped by its /64 prefix: one host or subscriber usually controls a whole /64,
 * so per-address buckets would let one visitor rotate addresses and fill the map.
 */
function bucketId(ip: string): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped && isIP(mapped[1]) === 4) return mapped[1];
  if (isIP(ip) !== 6) return ip;

  const addr = ip.split("%")[0].toLowerCase();
  const [head, tail = ""] = addr.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = addr.includes("::") && tail ? tail.split(":") : [];
  const fill = addr.includes("::") ? 8 - headParts.length - tailParts.length : 0;
  const groups = [...headParts, ...Array(Math.max(0, fill)).fill("0"), ...tailParts];
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/** Returns a bucket id for `raw` if it is a valid IP, otherwise null. */
function validIp(raw: string | null | undefined): string | null {
  const ip = raw?.trim();
  return ip && isIP(ip) !== 0 ? bucketId(ip) : null;
}

/**
 * The bucket id for this request's visitor: an IP (or IPv6 /64) when it can be trusted, else DIRECT_KEY.
 *
 * - PROXY_SECRET set: trust `X-Real-IP` only when `X-LLD-Proxy` equals PROXY_SECRET (constant-time),
 *   i.e. the request came through our Nginx, which overwrites X-Real-IP with $remote_addr.
 *   Anything else (direct hits on the Node port, forged headers) shares the single DIRECT_KEY bucket.
 * - PROXY_SECRET unset in production: always DIRECT_KEY. The headers cannot be trusted at all.
 * - PROXY_SECRET unset in development: fall back to X-Real-IP, then the first X-Forwarded-For entry.
 */
export function clientBucket(headers: Headers): string {
  const secret = process.env.PROXY_SECRET;
  checkSecretOnce(secret);

  if (secret) {
    const proof = headers.get("x-lld-proxy");
    if (proof === null) return DIRECT_KEY;
    if (!safeEqual(proof, secret)) {
      logMismatch();
      return DIRECT_KEY;
    }
    return validIp(headers.get("x-real-ip")) ?? DIRECT_KEY;
  }

  if (process.env.NODE_ENV === "production") return DIRECT_KEY;

  return (
    validIp(headers.get("x-real-ip")) ??
    validIp(headers.get("x-forwarded-for")?.split(",")[0]) ??
    DIRECT_KEY
  );
}

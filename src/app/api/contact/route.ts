import { NextResponse } from "next/server";

import { contactSchema, fieldErrors } from "@/lib/contact-schema";
import { sendInquiry } from "@/lib/mailer";
import { clientBucket, DIRECT_KEY, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 5 requests per 10 minutes per IP (or per the shared "contact:direct" bucket when the IP can't be trusted). */
const RATE = { limit: 5, windowMs: 10 * 60 * 1000 };
/**
 * At most 30 emails per hour across ALL visitors, so a botnet that rotates IPs cannot flood the inbox
 * or burn the SMTP account's reputation. Checked only after every other check passes, so rejected
 * and silently dropped requests never use it up. Real inquiries for a distributor are far below this.
 */
const GLOBAL_SEND_CAP = { limit: 30, windowMs: 60 * 60 * 1000, fixedKey: true };
/**
 * Mockup/demo mode (CONTACT_DEMO_MODE=1, any environment): every check still runs, then a valid
 * inquiry gets 200 without being sent, stored or logged. It skips the global send cap and takes
 * precedence over a missing SMTP config. Separate from CONTACT_DRY_RUN, which production still refuses.
 */
const DEMO_WARNING = "[contact] DEMO MODE: inquiries are NOT delivered. Unset CONTACT_DEMO_MODE before launch.";
let demoWarned = false;
function demoMode(): boolean {
  const on = process.env.CONTACT_DEMO_MODE === "1" || process.env.CONTACT_DEMO_MODE === "true";
  if (on && !demoWarned) {
    demoWarned = true;
    console.warn(DEMO_WARNING);
  }
  return on;
}
demoMode(); // warn at module load when the flag is already set

/** Forms submitted faster than this are treated as bots. */
const MIN_FILL_MS = 3000;
/** Generous cap on the raw body in bytes (the message field alone allows 5000 characters). Nginx enforces the same 32k. */
const MAX_BODY_BYTES = 32 * 1024;

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** Bots get the same answer as people, so they learn nothing. */
const silentOk = () => json({ ok: true });

const rateLimited = (retryAfterSec: number) =>
  json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": String(retryAfterSec) });

const tooLarge = () => json({ ok: false, error: "payload_too_large" }, 413);

/**
 * Read the body as UTF-8 with a running byte count, cancelling the stream as soon as it passes `max`.
 * Returns null when too large. Throws on invalid UTF-8.
 */
async function readBody(req: Request, max: number): Promise<string | null> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
}

export async function POST(req: Request) {
  // Same-origin only. Browsers always send Sec-Fetch-Site; non-browser clients may omit it.
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  // JSON only. This also rules out the "simple" content types a cross-site HTML form can send.
  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return json({ ok: false, error: "unsupported_media_type" }, 415);
  }

  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return tooLarge();

  const bucket = clientBucket(req.headers);
  const limited = rateLimit(`contact:${bucket}`, { ...RATE, fixedKey: bucket === DIRECT_KEY });
  if (!limited.ok) return rateLimited(limited.retryAfterSec);

  let raw: string | null;
  try {
    raw = await readBody(req, MAX_BODY_BYTES);
  } catch {
    return json({ ok: false, errors: { form: "Invalid request." } }, 400);
  }
  if (raw === null) return tooLarge();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, errors: { form: "Invalid request." } }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ ok: false, errors: { form: "Invalid request." } }, 400);
  }

  // Silent rejections, checked before validation.
  const { website, startedAt } = body as { website?: unknown; startedAt?: unknown };
  if (typeof website === "string" && website.trim() !== "") return silentOk();
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) return silentOk();
  // `startedAt` comes from the visitor's clock. A negative gap means that clock runs ahead of
  // ours, which is not evidence of a bot, so only a small positive gap is rejected.
  const elapsed = Date.now() - startedAt;
  if (elapsed >= 0 && elapsed < MIN_FILL_MS) return silentOk();

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, errors: fieldErrors(parsed.error) }, 400);
  }

  if (demoMode()) {
    const { inquiryType, state } = parsed.data;
    console.info(`[contact] DEMO MODE: inquiry accepted, NOT delivered. ${JSON.stringify({ inquiryType, state, submittedAt: new Date().toISOString() })}`);
    return json({ ok: true });
  }

  const globalCap = rateLimit("contact:global", GLOBAL_SEND_CAP);
  if (!globalCap.ok) {
    console.error(
      `[contact] Global send cap reached (${GLOBAL_SEND_CAP.limit}/hour). Inquiry was not sent (429), retry in ${globalCap.retryAfterSec}s.`,
    );
    // Distinct from per-IP "rate_limited": this visitor did nothing wrong, the site is just busy.
    return json({ ok: false, error: "busy" }, 429, { "Retry-After": String(globalCap.retryAfterSec) });
  }

  const result = await sendInquiry(parsed.data);
  if (result.ok) return json({ ok: true });
  if (result.reason === "not_configured") return json({ ok: false, error: "not_configured" }, 503);
  return json({ ok: false, error: "send_failed" }, 500);
}

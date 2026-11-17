import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { brand, contact, inquiryTypes, usStates } from "@/content/site";
import type { ContactInput } from "@/lib/contact-schema";
import { OUTSIDE_US } from "@/lib/contact-schema";

/**
 * Sends contact-form inquiries by SMTP (nodemailer). Server-only.
 *
 * Modes, decided per request from the environment (see .env.example):
 * - CONTACT_DRY_RUN=1 (development only): build the message with jsonTransport, send nothing,
 *   and log only non-personal fields (inquiry type, state, message length, timestamp).
 * - Development (NODE_ENV !== "production") without full SMTP config: same dry run,
 *   so the form works locally without credentials. The log line says why.
 * - Production with CONTACT_DRY_RUN set: refused. Inquiries would be silently dropped, so it is
 *   logged as an error and returns "not_configured" (the route returns 503).
 * - Production without SMTP config: "not_configured" (503).
 */

export type SendResult =
  | { ok: true; mode: "smtp" | "dry-run" }
  | { ok: false; reason: "not_configured" | "send_failed" };

const REQUIRED = ["SMTP_HOST", "CONTACT_TO", "CONTACT_FROM"] as const;

let smtp: { key: string; transporter: Transporter } | null = null;

function smtpTransport(): Transporter {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";
  const key = [process.env.SMTP_HOST, port, secure, process.env.SMTP_USER].join("|");
  if (smtp?.key !== key) {
    smtp = {
      key,
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        // true: TLS from the first byte (465). false: plain connect, then STARTTLS is mandatory.
        secure,
        requireTLS: !secure,
        tls: { minVersion: "TLSv1.2" },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      }),
    };
  }
  return smtp.transporter;
}

/** Strip CR/LF so user input can never add header lines. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

function describeState(code: string) {
  if (code === OUTSIDE_US) return contact.outsideUs;
  const match = usStates.find(([c]) => c === code);
  return match ? `${match[1]} (${match[0]})` : code;
}

export function buildMessage(data: ContactInput, submittedAt: Date) {
  const typeLabel = inquiryTypes.find((t) => t.value === data.inquiryType)?.label ?? data.inquiryType;
  const subject = oneLine(`New inquiry: ${typeLabel} from ${oneLine(data.company)}`);
  const text = [
    `New inquiry from the ${brand.name} website.`,
    "",
    `Inquiry type: ${typeLabel}`,
    `Name: ${oneLine(data.name)}`,
    `Company: ${oneLine(data.company)}`,
    `Email: ${oneLine(data.email)}`,
    `Phone: ${oneLine(data.phone) || "(not given)"}`,
    `State: ${describeState(data.state)}`,
    `Consent: Confirmed 21 or older and agreed to the Privacy Policy`,
    "",
    "Message:",
    data.message,
    "",
    `Submitted: ${submittedAt.toISOString()}`,
  ].join("\n");
  return { subject, text, replyTo: { name: oneLine(data.name), address: data.email } };
}

export async function sendInquiry(data: ContactInput, submittedAt = new Date()): Promise<SendResult> {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  const isProd = process.env.NODE_ENV === "production";
  const forcedDryRun = process.env.CONTACT_DRY_RUN === "1" || process.env.CONTACT_DRY_RUN === "true";

  if (forcedDryRun && isProd) {
    console.error("[contact] CONTACT_DRY_RUN is set in production. Refusing to drop inquiries; unset it. Inquiry was not sent (503).");
    return { ok: false, reason: "not_configured" };
  }

  const devDryRun = !forcedDryRun && missing.length > 0 && !isProd;

  if (!forcedDryRun && !devDryRun && missing.length > 0) {
    console.error(`[contact] Not configured: missing ${missing.join(", ")}. Inquiry was not sent (503).`);
    return { ok: false, reason: "not_configured" };
  }

  const { subject, text, replyTo } = buildMessage(data, submittedAt);

  if (forcedDryRun || devDryRun) {
    const why = forcedDryRun ? "CONTACT_DRY_RUN=1" : `development without SMTP config (missing ${missing.join(", ")})`;
    const transporter = nodemailer.createTransport({ jsonTransport: true });
    // Build the real message so composition errors still surface locally, but never log it:
    // it holds the visitor's name, email, phone and message.
    await transporter.sendMail({
      from: process.env.CONTACT_FROM || "dry-run@localhost",
      to: process.env.CONTACT_TO || "dry-run@localhost",
      replyTo,
      subject,
      text,
    });
    const summary = {
      inquiryType: data.inquiryType,
      state: data.state,
      messageLength: data.message.length,
      submittedAt: submittedAt.toISOString(),
    };
    console.info(`[contact] DRY RUN (${why}): email NOT sent. ${JSON.stringify(summary)}`);
    return { ok: true, mode: "dry-run" };
  }

  try {
    await smtpTransport().sendMail({
      from: process.env.CONTACT_FROM,
      to: process.env.CONTACT_TO,
      replyTo,
      subject,
      text,
    });
    return { ok: true, mode: "smtp" };
  } catch (err) {
    console.error(`[contact] SMTP send failed: ${err instanceof Error ? err.message : String(err)}`);
    return { ok: false, reason: "send_failed" };
  }
}

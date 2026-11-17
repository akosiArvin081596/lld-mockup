import { z } from "zod";

import { contact, inquiryTypes, usStates, type InquiryType } from "@/content/site";

/**
 * Contact form validation, shared by the client form and POST /api/contact.
 * Only the visitor's fields live here. The anti-spam fields (`website` honeypot and
 * `startedAt`) are checked separately in the route, before validation.
 */

const v = contact.validation;

export const inquiryValues = inquiryTypes.map((t) => t.value) as [InquiryType, ...InquiryType[]];

export const OUTSIDE_US = "outside-us" as const;
export const stateValues: [string, ...string[]] = [OUTSIDE_US, ...usStates.map(([code]) => code)];

export function isInquiryType(value: unknown): value is InquiryType {
  return typeof value === "string" && (inquiryValues as string[]).includes(value);
}

/** A trimmed, required string with a max length. */
const requiredText = (max: number, message: string) =>
  z
    .string({ required_error: message, invalid_type_error: message })
    .trim()
    .min(1, message)
    .max(max, v.tooLong);

export const contactSchema = z.object({
  name: requiredText(120, v.name),
  company: requiredText(160, v.company),
  email: z
    .string({ required_error: v.email, invalid_type_error: v.email })
    .trim()
    .min(1, v.email)
    .max(254, v.tooLong)
    .email(v.email),
  phone: z
    .string({ invalid_type_error: v.phone })
    .trim()
    .max(40, v.phone)
    .optional()
    .default(""),
  inquiryType: z.enum(inquiryValues, { errorMap: () => ({ message: v.inquiryType }) }),
  state: z.enum(stateValues, { errorMap: () => ({ message: v.state }) }),
  message: requiredText(5000, v.message),
  consent: z.literal(true, { errorMap: () => ({ message: v.consent }) }),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

/** Field order on the form; used to focus the first invalid field. */
export const contactFieldOrder: ContactField[] = [
  "name",
  "company",
  "email",
  "phone",
  "inquiryType",
  "state",
  "message",
  "consent",
];

/** Flatten zod issues to `{ field: firstMessage }`. */
export function fieldErrors(error: z.ZodError): Partial<Record<ContactField, string>> {
  const out: Partial<Record<ContactField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && key in contactSchema.shape && !(key in out)) {
      out[key as ContactField] = issue.message;
    }
  }
  return out;
}

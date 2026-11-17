"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { contact, contactDetails, inquiryTypes, usStates } from "@/content/site";
import {
  OUTSIDE_US,
  contactFieldOrder,
  contactSchema,
  fieldErrors,
  isInquiryType,
  type ContactField,
} from "@/lib/contact-schema";
import { cn } from "@/lib/utils";

type Values = {
  name: string;
  company: string;
  email: string;
  phone: string;
  inquiryType: string;
  state: string;
  message: string;
  consent: boolean;
  website: string;
};

type Errors = Partial<Record<ContactField, string>>;
type Status = "idle" | "sending" | "success" | "error" | "rate_limited" | "busy";

const initialValues: Values = {
  name: "",
  company: "",
  email: "",
  phone: "",
  inquiryType: "",
  state: "",
  message: "",
  consent: false,
  website: "",
};

const fieldId = (field: ContactField) => `contact-${field}`;
const errorId = (field: ContactField) => `contact-${field}-error`;

/**
 * Sharp 2px fields on char. The border keeps 3:1 against the coal panel behind the form (WCAG 1.4.11).
 * Focus: keyboard focus shows a 2px gold outline (offset 2px); every focus also grows a gold line
 * from the left along the bottom
 * (in <Field>, driven by `group-has-[:focus]`).
 */
const control =
  "block w-full rounded-sm border bg-char px-4 text-[1rem] text-parchment placeholder:text-stone/70 transition-colors duration-200 hover:border-stone focus:border-gold/60 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

function controlState(invalid: boolean) {
  return invalid ? "border-error" : "border-stone/60";
}

/** The inquiry type named in a URL's `?inquiry=`, if valid. */
function inquiryFrom(search: string) {
  const value = new URLSearchParams(search).get("inquiry");
  return isInquiryType(value) ? value : null;
}

export function ContactForm() {
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState("");
  const startedAt = useRef(0);
  const successRef = useRef<HTMLHeadingElement>(null);

  // Start the "time to fill" clock once the form is interactive.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Preselect the inquiry type from `?inquiry=`: on a fresh load, on back/forward, and when a
  // link such as the Partners CTAs is clicked on this same page (Next keeps this component mounted).
  useEffect(() => {
    const apply = (search: string) => {
      const type = inquiryFrom(search);
      if (type) setValues((v) => ({ ...v, inquiryType: type }));
    };
    apply(window.location.search);

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!anchor) return;
      const url = new URL(anchor.getAttribute("href") ?? "", window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname) apply(url.search);
    };
    const onPop = () => apply(window.location.search);

    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const validate = (next: Values) => {
    const result = contactSchema.safeParse(next);
    return result.success ? {} : fieldErrors(result.error);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const nextValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    const next = { ...values, [name]: nextValue } as Values;
    setValues(next);
    // Once a field shows an error, re-check it as the visitor fixes it.
    if (name in errors) {
      const field = name as ContactField;
      const nextErrors = { ...errors };
      const message = validate(next)[field];
      if (message) nextErrors[field] = message;
      else delete nextErrors[field];
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length === 0) setSummary("");
    }
  };

  const showErrors = (found: Errors) => {
    setErrors(found);
    setSummary(contact.errorSummary);
    const first = contactFieldOrder.find((f) => found[f]);
    if (first) document.getElementById(fieldId(first))?.focus();
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }

    setErrors({});
    setSummary("");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; errors?: Record<string, string> }
        | null;
      // Only errors for real form fields can be highlighted. Anything else (e.g. `form`) is the generic error.
      const fieldOnly: Errors = {};
      for (const f of contactFieldOrder) {
        const message = data?.errors?.[f];
        if (typeof message === "string" && message) fieldOnly[f] = message;
      }
      if (res.ok && data?.ok) {
        setStatus("success");
      } else if (res.status === 400 && Object.keys(fieldOnly).length > 0) {
        setStatus("idle");
        showErrors(fieldOnly);
      } else if (res.status === 429) {
        setStatus(data?.error === "busy" ? "busy" : "rate_limited");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="lld-settle border border-bronze/40 bg-obsidian px-6 py-14 sm:px-12 sm:py-20" role="status">
        <h3 ref={successRef} tabIndex={-1} className="text-4xl outline-none sm:text-5xl">
          {contact.success.title}
        </h3>
        <p className="mt-4 max-w-prose text-lg text-stone">{contact.success.body}</p>
      </div>
    );
  }

  const sending = status === "sending";
  const email: string = contactDetails.email;

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby={`${contact.id}-title`}
      className="relative"
    >
      <p aria-live="assertive" className={cn("text-[0.9375rem] text-error", summary ? "mb-8" : "sr-only")}>
        {summary}
      </p>

      <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:gap-y-4 [@media(min-width:1024px)_and_(max-height:800px)]:gap-y-3">
        <Field field="name" label={contact.fields.name} error={errors.name}>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={120}
            required
            value={values.name}
            onChange={onChange}
            {...describe("name", errors.name)}
            className={cn(control, "h-12 lg:h-11", controlState(!!errors.name))}
          />
        </Field>

        <Field field="company" label={contact.fields.company} error={errors.company}>
          <input
            id={fieldId("company")}
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={160}
            required
            value={values.company}
            onChange={onChange}
            {...describe("company", errors.company)}
            className={cn(control, "h-12 lg:h-11", controlState(!!errors.company))}
          />
        </Field>

        <Field field="email" label={contact.fields.email} error={errors.email}>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            required
            value={values.email}
            onChange={onChange}
            {...describe("email", errors.email)}
            className={cn(control, "h-12 lg:h-11", controlState(!!errors.email))}
          />
        </Field>

        <Field field="phone" label={contact.fields.phone} error={errors.phone}>
          <input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            value={values.phone}
            onChange={onChange}
            {...describe("phone", errors.phone)}
            className={cn(control, "h-12 lg:h-11", controlState(!!errors.phone))}
          />
        </Field>

        <Field field="inquiryType" label={contact.fields.inquiryType} error={errors.inquiryType}>
          <Select
            id={fieldId("inquiryType")}
            name="inquiryType"
            value={values.inquiryType}
            onChange={onChange}
            invalid={!!errors.inquiryType}
            describedBy={describe("inquiryType", errors.inquiryType)}
          >
            <option value="" disabled>
              {contact.selectPlaceholder}
            </option>
            {inquiryTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field field="state" label={contact.fields.state} error={errors.state}>
          <Select
            id={fieldId("state")}
            name="state"
            value={values.state}
            onChange={onChange}
            invalid={!!errors.state}
            describedBy={describe("state", errors.state)}
          >
            <option value="" disabled>
              {contact.statePlaceholder}
            </option>
            {usStates.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
            <option value={OUTSIDE_US}>{contact.outsideUs}</option>
          </Select>
        </Field>

        <Field field="message" label={contact.fields.message} error={errors.message} className="sm:col-span-2">
          <textarea
            id={fieldId("message")}
            name="message"
            rows={3}
            maxLength={5000}
            required
            value={values.message}
            onChange={onChange}
            {...describe("message", errors.message)}
            className={cn(control, "min-h-[9.5rem] resize-y py-3 leading-relaxed lg:min-h-[4.75rem] [@media(min-width:1024px)_and_(max-height:800px)]:h-[4.75rem]", controlState(!!errors.message))}
          />
        </Field>

      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="contact-website">{contact.honeypot}</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={onChange} />
      </div>

      {/* Consent and status on the left, the send button on the right. */}
      <div className="mt-8 flex flex-col gap-5 border-t border-bronze/30 pt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:mt-5 lg:pt-5">
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <div className="flex items-start gap-3.5">
              <input
                id={fieldId("consent")}
                name="consent"
                type="checkbox"
                required
                checked={values.consent}
                onChange={onChange}
                {...describe("consent", errors.consent)}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-sm accent-gold"
              />
              <label htmlFor={fieldId("consent")} className="cursor-pointer text-[0.9375rem] leading-relaxed text-parchment/90">
                <ConsentText />
              </label>
            </div>
            <FieldError field="consent" error={errors.consent} className="pl-[2.125rem]" />
          </div>
          <div aria-live="polite" className="text-[0.9375rem] leading-relaxed">
          {status === "error" || status === "rate_limited" || status === "busy" ? (
            <p className="text-error">
              {status === "busy" ? contact.busy : status === "rate_limited" ? contact.rateLimited : contact.error}
              {email ? (
                <>
                  {" "}
                  {contact.emailInstead}{" "}
                  <a href={`mailto:${email}`} className="text-gold underline underline-offset-4 hover:text-gilt">
                    {email}
                  </a>
                  .
                </>
              ) : null}
            </p>
          ) : null}
          </div>
        </div>
        <button
          type="submit"
          disabled={sending}
          aria-disabled={sending}
          className={cn(
            buttonVariants({ size: "lg" }),
            "relative shrink-0 overflow-hidden px-9 disabled:pointer-events-auto disabled:cursor-wait disabled:opacity-80",
          )}
        >
          {sending ? contact.sending : contact.submit}
          {sending ? (
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-obsidian/15">
              <span className="lld-sending-bar absolute inset-y-0 left-0 w-2/5 bg-obsidian/60" />
            </span>
          ) : null}
        </button>
      </div>
    </form>
  );
}

function describe(field: ContactField, error?: string) {
  return error ? { "aria-invalid": true as const, "aria-describedby": errorId(field) } : {};
}

function Field({
  field,
  label,
  error,
  className,
  children,
}: {
  field: ContactField;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={fieldId(field)} className="mb-2 block text-[0.9375rem] font-medium text-parchment/85 lg:mb-1.5">
        {label}
      </label>
      <div className="group relative">
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out-quint group-has-[:focus]:scale-x-100 motion-reduce:transition-none"
        />
      </div>
      <FieldError field={field} error={error} />
    </div>
  );
}

function FieldError({ field, error, className }: { field: ContactField; error?: string; className?: string }) {
  if (!error) return null;
  return (
    <p id={errorId(field)} className={cn("mt-2 text-[0.875rem] text-error", className)}>
      {error}
    </p>
  );
}

function Select({
  id,
  name,
  value,
  onChange,
  invalid,
  describedBy,
  children,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  invalid: boolean;
  describedBy: ReturnType<typeof describe>;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        required
        value={value}
        onChange={onChange}
        {...describedBy}
        className={cn(
          control,
          "h-12 cursor-pointer appearance-none pr-11 lg:h-11",
          value === "" && "text-stone",
          controlState(invalid),
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        strokeWidth={1.5}
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
      />
    </div>
  );
}

/** The consent sentence with "Privacy Policy" linked. */
function ConsentText() {
  const { label, href } = contact.privacyLink;
  const text = contact.fields.consent;
  // Case-insensitive, so the sentence and the link label can differ in capitalization.
  const at = text.toLowerCase().indexOf(label.toLowerCase());
  if (at < 0) return <>{text}</>;
  const end = at + label.length;
  return (
    <>
      {text.slice(0, at)}
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="text-gold underline decoration-gold/50 underline-offset-4 transition-colors duration-300 hover:text-gilt"
      >
        {text.slice(at, end)}
      </a>
      {text.slice(end)}
    </>
  );
}

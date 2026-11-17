import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, legalMetadata } from "@/components/site/legal-page";
import { brand, contactDetails, legalPages } from "@/content/site";

export const metadata: Metadata = legalMetadata("accessibility");

export default function AccessibilityPage() {
  const email: string = contactDetails.email;
  const phone: string = contactDetails.phone;

  return (
    <LegalPage title={legalPages.accessibility.title}>
      <p>
        {brand.name} wants everyone to be able to use this website, including people who use assistive
        technology. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>Use semantic page structure, headings and landmarks so the site works with screen readers.</li>
        <li>Make every link, button and form field usable with a keyboard, with a visible focus indicator.</li>
        <li>Keep text and controls at AA color contrast or better.</li>
        <li>Provide text alternatives for meaningful images.</li>
        <li>Label every form field, and explain errors in text next to the field they relate to.</li>
        <li>
          Give background video a visible pause control, and respect your device&rsquo;s reduced motion setting.
        </li>
        <li>Support zoom up to 200% and small screens without loss of content.</li>
      </ul>

      <h2>Ongoing work</h2>
      <p>
        We check the site with automated accessibility tools and keyboard-only navigation, and we keep
        accessibility in mind when we add or change content. Accessibility is ongoing work, and some parts of the site may not yet work
        as well as they should. If you find one, we want to know.
      </p>

      <h2>Report a barrier</h2>
      <p>
        If something on the site is hard to use, or you need information in another format, please contact us
        through the <Link href="/#contact">contact form on our website</Link>
        {email ? (
          <>
            , by email at <a href={`mailto:${email}`}>{email}</a>
          </>
        ) : null}
        {phone ? (
          <>
            {email ? "," : ""} or by phone at <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
          </>
        ) : null}
        . Please tell us the page address, what you were trying to do and the browser or assistive technology you
        were using. We will reply as soon as we can and work with you to provide the information you need.
      </p>
    </LegalPage>
  );
}

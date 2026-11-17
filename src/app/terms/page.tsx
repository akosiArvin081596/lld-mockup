// DRAFT: have counsel review before launch.
import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, legalMetadata } from "@/components/site/legal-page";
import { brand, contactDetails, legalPages } from "@/content/site";

export const metadata: Metadata = legalMetadata("terms");

export default function TermsPage() {
  const email: string = contactDetails.email;

  return (
    <LegalPage title={legalPages.terms.title}>
      <p>
        These terms apply to your use of the {brand.name} website (the &ldquo;site&rdquo;). By using the site, you
        agree to them. If you do not agree, please do not use the site.
      </p>

      <h2>Legal drinking age</h2>
      <p>
        The site is intended only for adults who are 21 or older, or of legal drinking age where they live, if
        higher. By using the site, you confirm that you meet that requirement. If you do not, you must leave the
        site.
      </p>

      <h2>An informational site</h2>
      <p>
        {brand.name} is a wholesale distributor of wine and spirits. The site describes our business and offers a
        way for producers, brand owners, retailers and hospitality businesses to contact us.
      </p>
      <p>
        <strong>We do not sell alcohol to consumers through this site.</strong> Nothing on the site is an offer to
        sell, or a solicitation to buy, any alcoholic beverage. Wholesale sales are made only to properly licensed
        businesses, in markets where we are licensed, and under separate written agreements that comply with
        applicable federal and state law.
      </p>
      <p>
        Sending an inquiry does not create a business relationship, an obligation to do business, or a
        confidential relationship. Please do not send confidential or proprietary information through the contact
        form unless we have agreed in writing to receive it.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the site for any unlawful purpose or in violation of these terms;</li>
        <li>submit false, misleading or harmful information, or impersonate anyone;</li>
        <li>interfere with the site&rsquo;s operation or security, or try to gain unauthorized access to it;</li>
        <li>send spam, or use automated means to submit the contact form or copy the site&rsquo;s content.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The site and its content, including the {brand.name} name, crest, logos, text, photography, video and
        design, belong to {brand.name} or its licensors and are protected by intellectual property laws. You may
        view the site for your own information. You may not copy, modify, distribute or use any of it for
        commercial purposes without our written permission. Product names and trademarks of producers belong to
        their respective owners.
      </p>

      <h2>Links to other websites</h2>
      <p>
        The site may link to websites run by others. We provide those links for convenience only. We do not control
        and are not responsible for their content, policies or practices, and a link does not mean we endorse them.
      </p>

      <h2>Disclaimers</h2>
      <p>
        We work to keep the site accurate and current, but the site and its content are provided &ldquo;as
        is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, express or implied, including
        warranties of merchantability, fitness for a particular purpose, accuracy and non-infringement. Information
        about our services and the markets we serve is general and may change without notice. We do not guarantee
        that the site will be uninterrupted, error-free or free of harmful components.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {brand.name} and its owners, employees and agents will not be liable
        for any indirect, incidental, special, consequential or punitive damages, or any loss of profits, data or
        goodwill, arising from or related to your use of, or inability to use, the site, even if we have been told
        such damages are possible. Some jurisdictions do not allow certain limitations, so some of these may not
        apply to you.
      </p>

      <h2>Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless {brand.name} from claims, losses and expenses, including reasonable
        legal fees, arising from your misuse of the site or your violation of these terms.
      </p>

      <h2>Privacy</h2>
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains how we handle information submitted through the
        site.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The date at the top of this page shows when they were last
        changed. Your continued use of the site after a change means you accept the updated terms.
      </p>

      <h2>General</h2>
      <p>
        If any part of these terms is found unenforceable, the rest remains in effect. Our failure to enforce any
        part of these terms is not a waiver of our right to do so later.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these terms can be sent through the <Link href="/#contact">contact form on our website</Link>
        {email ? (
          <>
            {" "}or by email at <a href={`mailto:${email}`}>{email}</a>
          </>
        ) : null}
        .
      </p>
    </LegalPage>
  );
}

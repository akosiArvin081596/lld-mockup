// DRAFT: have counsel review before launch.
import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, legalMetadata } from "@/components/site/legal-page";
import { ageGate, brand, contactDetails, legalPages } from "@/content/site";

export const metadata: Metadata = legalMetadata("privacy");

export default function PrivacyPage() {
  const email: string = contactDetails.email;

  return (
    <LegalPage title={legalPages.privacy.title}>
      <p>
        This policy explains what information {brand.name} (&ldquo;{brand.shortName},&rdquo; &ldquo;we,&rdquo;
        &ldquo;us&rdquo;) collects through this website, how we use it, and the choices you have. It applies only to
        this website. It does not cover information we receive offline or through other channels.
      </p>

      <h2>Information we collect</h2>
      <p>
        <strong>Information you send us.</strong> When you use the contact form, we collect the details you enter:
        your name, company, email address, phone number (optional), the type of inquiry, your state, and your
        message. We also record that you confirmed you are 21 or older and agreed to this policy.
      </p>
      <p>
        <strong>Technical information.</strong> Like most websites, our servers receive standard request
        information, such as your IP address, browser type and the pages requested. We use it to deliver the site,
        keep it secure and prevent abuse of the contact form (for example, limiting how many messages can be sent
        from one connection). We do not use it to build a profile of you.
      </p>

      <h2>Cookies, analytics and tracking</h2>
      <p>
        We do not use analytics services, advertising networks, social media pixels or tracking cookies. We do not
        sell or share your personal information for cross-context behavioral advertising.
      </p>
      <p>
        <strong>Age confirmation.</strong> When you confirm that you are of legal drinking age, your browser stores
        that confirmation and the time it was given in its local storage on your device, so you are not asked again
        on every visit. It expires after {ageGate.rememberDays} days. It is not sent to us, and you can remove it at
        any time by clearing your browser&rsquo;s site data.
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>To read and respond to your inquiry, and to route it to the right person on our team.</li>
        <li>To evaluate a possible business relationship with you or your company.</li>
        <li>To operate, secure and improve this website, and to prevent spam and misuse.</li>
        <li>To comply with legal obligations, including alcohol beverage laws that apply to our business.</li>
      </ul>
      <p>We do not send marketing email to people who contact us unless they ask us to.</p>

      <h2>How your information is shared</h2>
      <p>
        Messages sent through the contact form are delivered to our team by email through a third-party email
        service provider, which processes the message only to deliver it on our behalf. Our website is hosted by a
        service provider that processes technical information to serve the site. We may also disclose information
        when required by law, to protect our rights or the safety of others, or as part of a merger, acquisition or
        sale of business assets. We do not sell your personal information.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep inquiries for as long as needed to respond and to manage any resulting business relationship, and
        then for a reasonable period for our records or as required by law. Technical logs are kept for a short
        period for security purposes and then deleted. When information is no longer needed, we delete it.
      </p>

      <h2>How we protect it</h2>
      <p>
        The site is served over an encrypted connection, and access to inquiries is limited to the people who need
        them to do their work. No method of transmission or storage is completely secure, but we take reasonable
        steps to protect the information you give us.
      </p>

      <h2>Your privacy rights</h2>
      <p>
        Depending on the state where you live, you may have the right to:
      </p>
      <ul>
        <li>know what personal information we have collected about you and how we use it;</li>
        <li>access or receive a copy of that information;</li>
        <li>correct inaccurate information;</li>
        <li>ask us to delete it;</li>
        <li>opt out of the sale of personal information, targeted advertising or profiling (we do none of these);</li>
        <li>not be treated differently for exercising these rights.</li>
      </ul>
      <p>
        We honor these requests for all visitors, wherever they live, to the extent the law allows. We may need to
        confirm your identity before acting on a request. You may use an authorized agent to make a request on your
        behalf, and where your state provides one, you may appeal our decision by replying to our response.
      </p>

      <h3>California residents</h3>
      <p>
        The California Consumer Privacy Act, as amended, gives California residents the rights listed above. In the
        last 12 months we have collected identifiers (such as name, email address, phone number and IP address),
        professional information (such as company name) and the content of messages you choose to send us, for the
        business purposes described in this policy. We have not sold or shared personal information, and we do not
        collect sensitive personal information for the purpose of inferring characteristics about you. Because we do
        not use tracking technologies, there is nothing to opt out of through Global Privacy Control, but we treat
        that signal as a valid opt-out request.
      </p>

      <h2>Age requirement</h2>
      <p>
        This website is intended only for adults of legal drinking age (21 or older in the United States). We do not
        knowingly collect information from anyone under 21. If you believe someone under 21 has sent us information,
        please contact us and we will delete it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The date at the top of this page shows when it was last
        changed. Material changes will be noted on this page.
      </p>

      <h2>Contact us</h2>
      <p>
        To ask a question or make a privacy request, contact us through the{" "}
        <Link href="/#contact">contact form on our website</Link>
        {email ? (
          <>
            {" "}or by email at <a href={`mailto:${email}`}>{email}</a>
          </>
        ) : null}
        . Please say that your message is a privacy request.
      </p>
    </LegalPage>
  );
}

import { brand, contactDetails, seo } from "@/content/site";
import { siteUrl } from "@/lib/site-config";

/** schema.org Organization. contactPoint is added only once an email or phone is published. */
export function OrganizationJsonLd() {
  const hasContactPoint = Boolean(contactDetails.email || contactDetails.phone);

  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: siteUrl,
    logo: `${siteUrl}/icon-512.png`,
    description: seo.description,
    foundingDate: String(brand.established),
    ...(hasContactPoint
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            areaServed: "US",
            availableLanguage: "English",
            ...(contactDetails.email ? { email: contactDetails.email } : {}),
            ...(contactDetails.phone ? { telephone: contactDetails.phone } : {}),
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw JSON; "<" is escaped so the payload can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

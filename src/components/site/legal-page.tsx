import type { Metadata } from "next";

import { brand, legalPages } from "@/content/site";

type LegalKey = "privacy" | "terms" | "accessibility";

/** Shared share image (same as the layout default). */
const OG_IMAGE = { url: "/og-image.jpg", width: 1200, height: 630, alt: `${brand.name} crest` };

/**
 * Per-page metadata for the legal pages. Next.js replaces (does not merge) the layout's
 * openGraph and twitter objects, so each page restates site name, type, locale and image.
 */
export function legalMetadata(key: LegalKey): Metadata {
  const { title, description } = legalPages[key];
  const path = `/${key}`;
  const fullTitle = `${title} | ${brand.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: brand.name,
      locale: "en_US",
      title: fullTitle,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [OG_IMAGE.url] },
  };
}

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Shell for the Privacy, Terms and Accessibility pages: an obsidian title band that sits
 * under the fixed header, then the document on parchment in `.prose-legal`.
 */
export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <article aria-labelledby="legal-title">
      <header className="bg-obsidian pb-16 pt-[calc(var(--header-h)+4rem)] md:pb-20 md:pt-[calc(var(--header-h)+6rem)]">
        <div className="container">
          <h1 id="legal-title" className="text-[2.5rem] leading-[1.08] sm:text-5xl lg:text-[3.75rem]">
            {title}
          </h1>
          <p className="mt-6 text-[0.9375rem] text-stone">{legalPages.updated}</p>
        </div>
      </header>
      <div className="surface-light py-16 md:py-24">
        <div className="container">
          <div className="prose-legal">{children}</div>
        </div>
      </div>
    </article>
  );
}

import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Display, Libre_Caslon_Text, Libre_Franklin } from "next/font/google";

import "./globals.css";
import "./motion-hero.css";
import "./motion-sections.css";
import { a11y, brand, seo } from "@/content/site";
import { allowIndexing, siteUrl } from "@/lib/site-config";
import { AgeGate, AgeGateBootstrap } from "@/components/site/age-gate";
import { OrganizationJsonLd } from "@/components/site/organization-jsonld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { RevealController } from "@/components/site/reveal-controller";

// Type: American printing heritage (Arvin chose option A).
// Libre Caslon Display for large headlines (single weight, 400), Libre Caslon Text for
// smaller headings and italics, Libre Franklin for text and UI.
const serif = Libre_Caslon_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const serifText = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif-text",
  display: "swap",
  // Not used on the gate or the first hero screen: don't compete with them for bandwidth.
  preload: false,
});

const sans = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: seo.title, template: `%s | ${brand.name}` },
  description: seo.description,
  applicationName: brand.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: seo.title,
    description: seo.description,
    url: "/",
    locale: "en_US",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `${brand.name} crest` }],
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
    images: ["/og-image.jpg"],
  },
  robots: allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#12110F",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${serif.variable} ${serifText.variable} ${sans.variable}`}>
      <body>
        <AgeGateBootstrap />
        <a
          href="#main"
          className="sr-only z-[100] bg-gold px-4 py-3 font-sans text-sm font-medium text-obsidian focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {a11y.skipToContent}
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
        <AgeGate />
        <RevealController />
        <OrganizationJsonLd />
      </body>
    </html>
  );
}

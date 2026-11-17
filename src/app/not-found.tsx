import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { brand, notFound } from "@/content/site";

export const metadata: Metadata = {
  title: notFound.title,
  description: notFound.body,
  robots: { index: false, follow: true },
  // An error page has no canonical address (the layout default points at the home page).
  alternates: { canonical: null },
  // Its own share text, so a shared broken link never shows the home page title.
  openGraph: {
    type: "website",
    siteName: brand.name,
    locale: "en_US",
    title: `${notFound.title} | ${brand.name}`,
    description: notFound.body,
  },
  twitter: { card: "summary", title: `${notFound.title} | ${brand.name}`, description: notFound.body },
};

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="relative flex min-h-[100svh] items-center bg-obsidian pb-24 pt-[calc(var(--header-h)+4rem)]"
    >
      <div className="container">
        <div className="grid items-center gap-y-12 md:grid-cols-12 md:gap-x-10">
          <div className="md:col-span-7">
            <h1 id="not-found-title" className="text-[2.5rem] leading-[1.08] sm:text-5xl lg:text-[4rem]">
              {notFound.title}
            </h1>
            <p className="mt-6 max-w-[48ch] text-lg text-stone">{notFound.body}</p>
            <p className="mt-3 text-[0.875rem] text-stone/80">{notFound.label}</p>
            <div className="mt-10">
              <Button asChild variant="outline" size="lg">
                <Link href={notFound.cta.href}>{notFound.cta.label}</Link>
              </Button>
            </div>
          </div>
          <div aria-hidden="true" className="hidden md:col-span-4 md:col-start-9 md:block">
            <div className="relative mx-auto aspect-[1136/1146] w-full max-w-[20rem] opacity-80">
              <Image src="/brand/crest-mark.png" alt="" fill sizes="20rem" className="object-contain" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

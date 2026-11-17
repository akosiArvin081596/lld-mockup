import type { MetadataRoute } from "next";

import { allowIndexing, siteUrl } from "@/lib/site-config";

/** Crawlers stay out until NEXT_PUBLIC_ALLOW_INDEXING=true (see .env.example). */
export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

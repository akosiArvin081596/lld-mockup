import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-config";

const lastModified = new Date("2026-11-17");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/accessibility`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}

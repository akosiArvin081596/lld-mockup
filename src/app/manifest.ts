import type { MetadataRoute } from "next";

import { brand, seo } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#12110F",
    theme_color: "#12110F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

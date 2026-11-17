/**
 * Build-time site settings from the environment (see .env.example).
 * SITE_URL must be set in .env.production before `pnpm build` on the VPS.
 */
export const siteUrl = (process.env.SITE_URL || "http://localhost:3410").replace(/\/+$/, "");

/** Search engines stay out until the launch is approved. */
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

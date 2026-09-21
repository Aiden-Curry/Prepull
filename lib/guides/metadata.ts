import type { Metadata } from "next";
// Set to the intended public production origin before publishing. No preview-host inference.
export function siteOrigin(env: Record<string, string | undefined> = process.env) {
  const raw = env.PREPULL_SITE_URL || env.NEXTAUTH_URL || "http://localhost:3000";
  const url = new URL(raw);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("Site URL must be an HTTP(S) origin without credentials or a path.");
  return url.origin;
}
export function guideMetadata(title: string, description: string, path: string): Metadata {
  const canonical = `${siteOrigin()}${path}`;
  return { title: `${title} | PrePull Guides`, description, alternates: { canonical }, robots: { index: true, follow: true }, openGraph: { title, description, url: canonical, type: "website", siteName: "PrePull" } };
}

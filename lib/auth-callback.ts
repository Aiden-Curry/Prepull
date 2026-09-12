import type { ContentVersion } from "./types.ts";
import { versionedHref } from "./navigation.ts";

export const DEFAULT_AUTH_CALLBACK = "/era/guilds";

type SearchParams = Record<string, string | string[] | undefined>;

export function sanitizeAuthCallback(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_CALLBACK,
) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;

  try {
    const parsed = new URL(value, "https://prepull.internal");
    if (parsed.origin !== "https://prepull.internal" || !/^\/(?:era|tbc)(?:\/|$)/.test(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function authSignInHref(callbackUrl: string) {
  return `/auth/signin?callbackUrl=${encodeURIComponent(sanitizeAuthCallback(callbackUrl))}`;
}

export function protectedRouteCallback(
  version: ContentVersion,
  path: string,
  searchParams?: SearchParams,
) {
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(searchParams ?? {})) {
    for (const value of Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]) query.append(key, value);
  }
  return versionedHref(version, path, query.toString());
}

/**
 * The current guild UI renders item and character imagery as text/icon
 * components. Keep URL acceptance closed until a reviewed image provider is
 * introduced; this prevents a future image source from becoming an SSRF or
 * untrusted-content boundary by accident.
 */
export function isTrustedImageUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "static.prepull.app";
  } catch {
    return false;
  }
}

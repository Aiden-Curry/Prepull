import type { ContentVersion } from "./types";

function suffix(search = "", hash = "") {
  const normalizedSearch = search && !search.startsWith("?") ? `?${search}` : search;
  const normalizedHash = hash && !hash.startsWith("#") ? `#${hash}` : hash;
  return `${normalizedSearch}${normalizedHash}`;
}

export function versionedHref(version: ContentVersion, path = "", search = "", hash = "") {
  const normalizedPath = !path || path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return `/${version}${normalizedPath}${suffix(search, hash)}`;
}

export function switchContentVersionHref(
  nextVersion: ContentVersion,
  pathname: string,
  search = "",
  hash = "",
) {
  const match = pathname.match(/^\/(?:era|tbc)(\/.*)?$/);
  return versionedHref(nextVersion, match?.[1] ?? "", search, hash);
}

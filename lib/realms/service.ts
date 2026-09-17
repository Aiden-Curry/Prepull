import { REALM_CATALOG, searchRealms, type RealmEntry } from "./catalog.ts";
import { getBlizzardAccessToken } from "../blizzard/oauth.ts";
import { getBlizzardContext } from "../blizzard/version-map.ts";
import { realmCache, CACHE_TTL } from "../server/cache.ts";
import type { CharacterRealmType, Region } from "../types.ts";
const pending = new Map<string, Promise<RealmEntry[]>>();
export async function getRealmCatalog(region: Region, realmType: CharacterRealmType): Promise<RealmEntry[]> {
  const fallback = searchRealms(REALM_CATALOG, region, realmType);
  if (realmType === "anniversary" || process.env.PREPULL_CHARACTER_PROVIDER === "mock") return fallback;
  const key = `catalog:${realmType}:${region}`;
  const cached = realmCache.get<RealmEntry[]>(key); if (cached) return cached;
  const existing = pending.get(key); if (existing) return existing;
  const request = (async () => {
    try {
      const context = getBlizzardContext(realmType, region); const token = await getBlizzardAccessToken(region);
      const url = new URL(`https://${region}.api.blizzard.com/data/wow/realm/index`);
      url.search = new URLSearchParams({ namespace: context.dynamicNamespace, locale: context.locale }).toString();
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Realm catalog unavailable");
      const data = await response.json() as { realms?: { name?: string; slug?: string; id?: number }[] };
      const realms = (data.realms ?? []).flatMap((entry) => typeof entry.name === "string" && typeof entry.slug === "string" && /^[a-z0-9-]{1,64}$/.test(entry.slug) ? [{ name: entry.name, slug: entry.slug, id: entry.id, region, realmType }] : []);
      if (!realms.length) throw new Error("Empty realm catalog");
      realmCache.set(key, realms, CACHE_TTL.realmMs); return realms;
    } catch { realmCache.set(key, fallback, 5 * 60_000); return fallback; }
  })().finally(() => pending.delete(key));
  pending.set(key, request); return request;
}

import { CharacterProviderError } from "../providers/character-provider";
import { CharacterRealmType, Region } from "../types";
import { CACHE_TTL, realmCache } from "../server/cache";
import { getBlizzardAccessToken } from "./oauth";
import { getBlizzardContext } from "./version-map";

type BlizzardRealm = { slug?: string };
type BlizzardRealmIndex = { realms?: BlizzardRealm[] };

export async function validateBlizzardRealm(realmType: CharacterRealmType, region: Region, realm: string) {
  const context = getBlizzardContext(realmType, region);
  const key = `${realmType}:${region}`;
  let realms = realmCache.get<BlizzardRealm[]>(key);
  if (!realms) {
    const token = await getBlizzardAccessToken(region);
    const response = await fetch(`https://${region}.api.blizzard.com/data/wow/realm/index?namespace=${encodeURIComponent(context.dynamicNamespace)}&locale=${encodeURIComponent(context.locale)}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401 || response.status === 403) throw new CharacterProviderError("AuthenticationFailure", "Blizzard rejected the configured credentials.", response.status);
    if (response.status === 429) throw new CharacterProviderError("RateLimited", "Blizzard is rate limiting requests. Try again shortly.", 429);
    if (!response.ok) throw new CharacterProviderError("ProviderUnavailable", "Blizzard realm data is currently unavailable.", response.status);
    const payload = await response.json() as BlizzardRealmIndex;
    realms = payload.realms ?? [];
    realmCache.set(key, realms, CACHE_TTL.realmMs);
  }
  if (!realms.some((entry) => entry.slug?.toLowerCase() === realm.toLowerCase())) {
    throw new CharacterProviderError("RealmNotFound", "Realm not found.", 404);
  }
}

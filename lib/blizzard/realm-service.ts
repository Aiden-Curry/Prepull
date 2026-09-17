import { CharacterProviderError } from "../providers/character-provider.ts";
import type { CharacterRealmType, Region } from "../types.ts";
import { getRealmCatalog } from "../realms/service.ts";
import { getBlizzardContext } from "./version-map.ts";
export async function validateBlizzardRealm(realmType: CharacterRealmType, region: Region, realm: string) {
  getBlizzardContext(realmType, region);
  const realms = await getRealmCatalog(region, realmType);
  if (!realms.some((entry) => entry.slug === realm.toLowerCase())) throw new CharacterProviderError("RealmNotFound", "Realm not found.", 404);
}

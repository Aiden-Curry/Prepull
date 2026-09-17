import { normalizeCharacterName, normalizeLookup } from "../characters/normalization.ts";
import { type CharacterProvider, type CharacterLookup, CharacterProviderError } from "../providers/character-provider.ts";
import type { CharacterRealmType, CharacterTalent, ContentVersion, Faction, NormalizedCharacter, Region } from "../types.ts";
import { CACHE_TTL, characterCache } from "../server/cache.ts";
import { getBlizzardAccessToken } from "./oauth.ts";
import { normalizeEquipment, type BlizzardEquipmentEntry } from "../armory/equipment.ts";
import { withVerifiedItemMetadata } from "../armory/item-metadata.ts";
import { normalizeStatistics, normalizeTalentState } from "../armory/normalize.ts";
import type { UnavailableSection } from "../armory/types.ts";
import { getBlizzardContext } from "./version-map.ts";
import { validateBlizzardRealm } from "./realm-service.ts";

type BlizzardProfile = { id?: number; name?: string; level?: number; race?: { name?: string }; character_class?: { name?: string }; faction?: { type?: string }; realm?: { name?: string }; last_login_timestamp?: number };
type BlizzardEquipment = { equipped_items?: BlizzardEquipmentEntry[] };
type BlizzardSpecialization = { specialization_name?: string; spent_points?: number; talents?: Array<{ talent?: { name?: string }; rank?: number }> };
type BlizzardSpecializations = { specialization_groups?: Array<{ is_active?: boolean; specializations?: BlizzardSpecialization[] }> };
const factionMap: Record<string, Faction> = { ALLIANCE: "Alliance", HORDE: "Horde" };
function safeLookup(lookup: CharacterLookup): CharacterLookup { const characterName = normalizeCharacterName(lookup.characterName); if (!/^(eu|us)$/.test(lookup.region) || !["era", "tbc"].includes(lookup.contentVersion) || !["era", "anniversary"].includes(lookup.realmType) || !/^[a-z0-9-]{1,64}$/i.test(normalizeLookup(lookup.realm)) || !/^\p{L}[\p{L}\p{M}-]{0,31}$/u.test(characterName)) throw new CharacterProviderError("MalformedProviderResponse", "That character lookup is not valid."); return { ...lookup, realm: normalizeLookup(lookup.realm), characterName }; }

export class BattleNetCharacterProvider implements CharacterProvider {
  async findCharacter(input: CharacterLookup) { return this.load(input, false); }
  async findPublicCharacter(input: CharacterLookup) { return this.load(input, true); }
  private async load(input: CharacterLookup, publicLookup: boolean) {
    const lookup = safeLookup(input);
    const context = getBlizzardContext(lookup.realmType, lookup.region);
    const cacheKey = `${publicLookup ? "public" : "saved"}:${lookup.contentVersion}:${lookup.realmType}:${lookup.region}:${lookup.realm}:${lookup.characterName}`;
    const cached = characterCache.get<NormalizedCharacter>(cacheKey);
    if (cached) return cached;
    await validateBlizzardRealm(lookup.realmType, lookup.region, lookup.realm);
    const token = await getBlizzardAccessToken(lookup.region);
    const base = `https://${lookup.region}.api.blizzard.com/profile/wow/character/${encodeURIComponent(lookup.realm)}/${encodeURIComponent(lookup.characterName)}`;
    const [profileResponse, equipmentResponse, specializations, statistics] = await Promise.all([
      this.request(base, context.profileNamespace, context.locale, token, "profile"),
      this.optional(`${base}/equipment`, context.profileNamespace, context.locale, token, "equipment"),
      this.optional(`${base}/specializations`, context.profileNamespace, context.locale, token, "specializations"),
      this.optional(`${base}/statistics`, context.profileNamespace, context.locale, token, "statistics"),
    ]);
    const profile = await this.parse<BlizzardProfile>(profileResponse, "profile");
    const equipment = equipmentResponse.payload as BlizzardEquipment | undefined;
    const equipmentAvailable = !equipmentResponse.failure && Array.isArray(equipment?.equipped_items);
    if (!publicLookup && !equipmentAvailable) throw new CharacterProviderError("ProviderUnavailable", "Equipment could not be loaded. Your prior successful snapshot is unchanged.");

    if (!profile.id || !profile.name || !profile.realm?.name || typeof profile.level !== "number") throw new CharacterProviderError("MalformedProviderResponse", "Blizzard returned incomplete character data.");
    const active = (specializations.payload as BlizzardSpecializations | undefined)?.specialization_groups?.find((group) => group.is_active)?.specializations?.[0];
    const normalized: NormalizedCharacter = { id: `blizzard:${lookup.contentVersion}:${lookup.realmType}:${lookup.region}:${profile.id}`, name: profile.name, region: lookup.region, realm: profile.realm.name, contentVersion: lookup.contentVersion, realmType: lookup.realmType, level: profile.level, race: profile.race?.name ?? "Unavailable", class: profile.character_class?.name ?? "Unavailable", spec: active?.specialization_name ?? "Unavailable", faction: factionMap[(profile.faction?.type ?? "").toUpperCase()] ?? "Alliance", professions: [], talents: this.normalizeTalents(active), equipment: normalizeEquipment(equipmentAvailable ? equipment! : {}).map((item) => withVerifiedItemMetadata(item, lookup.realmType)), equipmentStatus: equipmentAvailable ? "available" : "unavailable", armory: { statistics: statistics.failure ?? normalizeStatistics(statistics.payload, new Date().toISOString()), talents: specializations.failure ?? normalizeTalentState(specializations.payload, new Date().toISOString()) }, dataMeta: { provider: "blizzard", isLive: true, retrievedAt: new Date().toISOString(), lastUpdated: profile.last_login_timestamp ? new Date(profile.last_login_timestamp).toISOString() : new Date().toISOString() } };
    characterCache.set(cacheKey, normalized, CACHE_TTL.characterMs);
    return normalized;
  }
  async getCharacter(id: string) { const parts = id.split(":"); if (parts.length !== 6 || parts[0] !== "blizzard") return null; return this.findCharacter({ contentVersion: parts[1] as ContentVersion, realmType: parts[2] as CharacterRealmType, region: parts[3] as Region, realm: parts[4], characterName: parts[5] }); }
  private normalizeTalents(specialization?: BlizzardSpecialization): CharacterTalent[] { return (specialization?.talents ?? []).flatMap((talent) => talent.talent?.name ? [{ name: talent.talent.name, rank: talent.rank ?? 0 }] : []); }
  private async request(url: string, namespace: string, locale: string, token: string, category: string) { let response: Response; try { response = await fetch(`${url}?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(10000) }); } catch { throw new CharacterProviderError("ProviderUnavailable", "Blizzard is currently unavailable. Try again shortly."); } if (response.status === 404) throw new CharacterProviderError("CharacterNotFound", "Character not found.", 404); if (response.status === 401 || response.status === 403) throw new CharacterProviderError("AuthenticationFailure", "Blizzard rejected the configured credentials.", response.status); if (response.status === 429) throw new CharacterProviderError("RateLimited", "Blizzard is rate limiting requests. Try again shortly.", 429); if (!response.ok) { console.error("[blizzard] API request failure", { provider: "blizzard", endpointCategory: category, status: response.status }); throw new CharacterProviderError("ProviderUnavailable", "Blizzard is currently unavailable. Try again shortly.", response.status); } return response; }
  private async parse<T>(response: Response, category: string) { try { return await response.json() as T; } catch { console.error("[blizzard] malformed response", { provider: "blizzard", endpointCategory: category, status: response.status }); throw new CharacterProviderError("MalformedProviderResponse", "Blizzard returned an unreadable response."); } }
  private async optional(url: string, namespace: string, locale: string, token: string, category: string): Promise<{ payload?: unknown; failure?: UnavailableSection }> {
    try { return { payload: await this.parse(await this.request(url, namespace, locale, token, category), category) }; }
    catch (error) { return { failure: error instanceof CharacterProviderError && error.status === 404 ? { status: "unavailable", reason: "unsupported" } : { status: "temporary-error" } }; }
  }
}

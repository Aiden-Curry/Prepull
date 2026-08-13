import { normalizeLookup } from "../characters/normalization";
import { CharacterProvider, CharacterLookup, CharacterProviderError } from "../providers/character-provider";
import { CharacterRealmType, CharacterTalent, ContentVersion, EquippedItem, EquipmentSlot, Faction, ItemQuality, NormalizedCharacter, Region } from "../types";
import { CACHE_TTL, characterCache } from "../server/cache";
import { getBlizzardAccessToken } from "./oauth";
import { BlizzardItemDataProvider } from "./item-data-provider";
import { getBlizzardContext } from "./version-map";
import { validateBlizzardRealm } from "./realm-service";

type BlizzardProfile = { id?: number; name?: string; level?: number; race?: { name?: string }; character_class?: { name?: string }; faction?: { type?: string }; realm?: { name?: string }; last_login_timestamp?: number };
type BlizzardEquipmentEntry = { slot?: { name?: string; type?: string }; item?: { id?: number }; name?: string; quality?: { type?: string }; stats?: Array<{ type?: { name?: string }; value?: number }>; enchantments?: Array<{ display_string?: string; enchantment_id?: number }> };
type BlizzardEquipment = { equipped_items?: BlizzardEquipmentEntry[] };
type BlizzardSpecialization = { specialization_name?: string; spent_points?: number; talents?: Array<{ talent?: { name?: string }; rank?: number }> };
type BlizzardSpecializations = { specialization_groups?: Array<{ is_active?: boolean; specializations?: BlizzardSpecialization[] }> };
const slotMap: Record<string, EquipmentSlot> = { HEAD: "Head", NECK: "Neck", SHOULDER: "Shoulder", BACK: "Back", CHEST: "Chest", WRIST: "Wrist", HANDS: "Hands", WAIST: "Waist", LEGS: "Legs", FEET: "Feet", FINGER_1: "Finger 1", FINGER_2: "Finger 2", TRINKET_1: "Trinket 1", TRINKET_2: "Trinket 2", MAIN_HAND: "Main Hand", OFF_HAND: "Off Hand / Shield", SHIELD: "Off Hand / Shield", RANGED: "Ranged / Relic", RELIC: "Ranged / Relic" };
const qualityMap: Record<string, ItemQuality> = { POOR: "Poor", COMMON: "Common", UNCOMMON: "Uncommon", RARE: "Rare", EPIC: "Epic", LEGENDARY: "Legendary" };
const factionMap: Record<string, Faction> = { ALLIANCE: "Alliance", HORDE: "Horde" };
function safeLookup(lookup: CharacterLookup): CharacterLookup { if (!/^(eu|us)$/.test(lookup.region) || !["era", "tbc"].includes(lookup.contentVersion) || !["era", "anniversary"].includes(lookup.realmType) || !/^[a-z0-9-]{1,64}$/i.test(normalizeLookup(lookup.realm)) || !/^[a-z0-9-]{1,32}$/i.test(normalizeLookup(lookup.characterName))) throw new CharacterProviderError("MalformedProviderResponse", "That character lookup is not valid."); return { ...lookup, realm: normalizeLookup(lookup.realm), characterName: normalizeLookup(lookup.characterName) }; }

export class BattleNetCharacterProvider implements CharacterProvider {
  private readonly itemProvider = new BlizzardItemDataProvider();
  async findCharacter(input: CharacterLookup) {
    const lookup = safeLookup(input);
    const context = getBlizzardContext(lookup.realmType, lookup.region);
    const cacheKey = `${lookup.contentVersion}:${lookup.realmType}:${lookup.region}:${lookup.realm}:${lookup.characterName}`;
    const cached = characterCache.get<NormalizedCharacter>(cacheKey);
    if (cached) return cached;
    await validateBlizzardRealm(lookup.realmType, lookup.region, lookup.realm);
    const token = await getBlizzardAccessToken(lookup.region);
    const base = `https://${lookup.region}.api.blizzard.com/profile/wow/character/${encodeURIComponent(lookup.realm)}/${encodeURIComponent(lookup.characterName)}`;
    const [profileResponse, equipmentResponse, specializationResponse] = await Promise.all([
      this.request(base, context.profileNamespace, context.locale, token, "profile"),
      this.request(`${base}/equipment`, context.profileNamespace, context.locale, token, "equipment"),
      this.request(`${base}/specializations`, context.profileNamespace, context.locale, token, "specializations"),
    ]);
    const profile = await this.parse<BlizzardProfile>(profileResponse, "profile");
    const equipment = await this.parse<BlizzardEquipment>(equipmentResponse, "equipment");
    const specializations = await this.parse<BlizzardSpecializations>(specializationResponse, "specializations");
    if (!profile.id || !profile.name || !profile.realm?.name || typeof profile.level !== "number") throw new CharacterProviderError("MalformedProviderResponse", "Blizzard returned incomplete character data.");
    const active = specializations.specialization_groups?.find((group) => group.is_active)?.specializations?.[0];
    const normalized: NormalizedCharacter = { id: `blizzard:${lookup.contentVersion}:${lookup.realmType}:${lookup.region}:${profile.id}`, name: profile.name, region: lookup.region, realm: profile.realm.name, contentVersion: lookup.contentVersion, realmType: lookup.realmType, level: profile.level, race: profile.race?.name ?? "Unavailable", class: profile.character_class?.name ?? "Unavailable", spec: active?.specialization_name ?? "Unavailable", faction: factionMap[(profile.faction?.type ?? "").toUpperCase()] ?? "Alliance", professions: [], talents: this.normalizeTalents(active), equipment: await this.normalizeEquipment(equipment, lookup), dataMeta: { provider: "blizzard", isLive: true, lastUpdated: profile.last_login_timestamp ? new Date(profile.last_login_timestamp).toISOString() : new Date().toISOString() } };
    characterCache.set(cacheKey, normalized, CACHE_TTL.characterMs);
    return normalized;
  }
  async getCharacter(id: string) { const parts = id.split(":"); if (parts.length !== 6 || parts[0] !== "blizzard") return null; return this.findCharacter({ contentVersion: parts[1] as ContentVersion, realmType: parts[2] as CharacterRealmType, region: parts[3] as Region, realm: parts[4], characterName: parts[5] }); }
  private normalizeTalents(specialization?: BlizzardSpecialization): CharacterTalent[] { return (specialization?.talents ?? []).flatMap((talent) => talent.talent?.name ? [{ name: talent.talent.name, rank: talent.rank ?? 0 }] : []); }
  private async request(url: string, namespace: string, locale: string, token: string, category: string) { let response: Response; try { response = await fetch(`${url}?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(10000) }); } catch { throw new CharacterProviderError("ProviderUnavailable", "Blizzard is currently unavailable. Try again shortly."); } if (response.status === 404) throw new CharacterProviderError("CharacterNotFound", "Character not found.", 404); if (response.status === 401 || response.status === 403) throw new CharacterProviderError("AuthenticationFailure", "Blizzard rejected the configured credentials.", response.status); if (response.status === 429) throw new CharacterProviderError("RateLimited", "Blizzard is rate limiting requests. Try again shortly.", 429); if (!response.ok) { console.error("[blizzard] API request failure", { provider: "blizzard", endpointCategory: category, status: response.status }); throw new CharacterProviderError("ProviderUnavailable", "Blizzard is currently unavailable. Try again shortly.", response.status); } return response; }
  private async parse<T>(response: Response, category: string) { try { return await response.json() as T; } catch { console.error("[blizzard] malformed response", { provider: "blizzard", endpointCategory: category, status: response.status }); throw new CharacterProviderError("MalformedProviderResponse", "Blizzard returned an unreadable response."); } }
  private async normalizeEquipment(payload: BlizzardEquipment, lookup: CharacterLookup) { const result: EquippedItem[] = []; for (const entry of payload.equipped_items ?? []) { const itemId = entry.item?.id; const slotKey = (entry.slot?.type ?? entry.slot?.name ?? "").toUpperCase().replaceAll(" ", "_"); const slot = slotMap[slotKey]; if (!itemId || !slot) continue; const stats = Object.fromEntries((entry.stats ?? []).filter((stat) => stat.type?.name).map((stat) => [stat.type!.name!, String(stat.value ?? 0)])); const item: EquippedItem = { itemId, name: entry.name ?? `Item ${itemId}`, slot, quality: qualityMap[(entry.quality?.type ?? "").toUpperCase()] ?? "Common", icon: slot.slice(0, 2).toUpperCase(), stats, enchantments: entry.enchantments?.map((enchantment) => enchantment.display_string ?? (enchantment.enchantment_id ? `Enchantment ${enchantment.enchantment_id}` : "")).filter(Boolean) }; const metadata = await this.itemProvider.getItem(lookup.region, lookup.contentVersion, lookup.realmType, itemId); if (metadata) item.itemLevel = metadata.itemLevel; result.push(item); } return result; }
}

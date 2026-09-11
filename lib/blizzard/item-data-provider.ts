import type { CharacterRealmType, ContentVersion, EquippedItem, ItemQuality, Region } from "../types.ts";
import { getBlizzardContext } from "./version-map.ts";
import { getBlizzardAccessToken } from "./oauth.ts";
import { CACHE_TTL, itemCache } from "../server/cache.ts";

type BlizzardItem = { id?: number; name?: string; quality?: { type?: string }; level?: number; inventory_type?: { type?: string }; stats?: Array<{ type?: { name?: string }; value?: number }>; weapon?: { damage?: { min?: number; max?: number }; attack_speed?: number; dps?: number | { value?: number }; type?: { type?: string } } };
export type ItemFetchReason = "missing-credentials" | "oauth-failed" | "unauthorized" | "forbidden" | "not-found" | "invalid-namespace" | "rate-limited" | "network-error" | "malformed-response" | "normalization-error" | "unknown-error";
export type ItemFetchDiagnostic = { itemId: number; item?: EquippedItem; reason?: ItemFetchReason; status?: number; namespace: string; region: Region; oauthSucceeded: boolean };
export interface ItemDataProvider { getItem(region: Region, contentVersion: ContentVersion, realmType: CharacterRealmType, itemId: number): Promise<EquippedItem | null>; }

const qualityMap: Record<string, ItemQuality> = { POOR: "Poor", COMMON: "Common", UNCOMMON: "Uncommon", RARE: "Rare", EPIC: "Epic", LEGENDARY: "Legendary" };
const slotMap: Record<string, EquippedItem["slot"]> = {
  HEAD: "Head", INVTYPE_HEAD: "Head", NECK: "Neck", INVTYPE_NECK: "Neck", SHOULDER: "Shoulder", INVTYPE_SHOULDER: "Shoulder",
  BACK: "Back", CLOAK: "Back", INVTYPE_CLOAK: "Back", CHEST: "Chest", INVTYPE_CHEST: "Chest", ROBE: "Chest", INVTYPE_ROBE: "Chest",
  WRIST: "Wrist", INVTYPE_WRIST: "Wrist", HANDS: "Hands", HAND: "Hands", INVTYPE_HAND: "Hands", WAIST: "Waist", INVTYPE_WAIST: "Waist",
  LEGS: "Legs", INVTYPE_LEGS: "Legs", FEET: "Feet", INVTYPE_FEET: "Feet", FINGER: "Finger 1", INVTYPE_FINGER: "Finger 1",
  TRINKET: "Trinket 1", INVTYPE_TRINKET: "Trinket 1", MAIN_HAND: "Main Hand", WEAPONMAINHAND: "Main Hand", INVTYPE_WEAPON: "Main Hand",
  OFF_HAND: "Off Hand / Shield", INVTYPE_WEAPONOFFHAND: "Off Hand / Shield", WEAPON: "Main Hand", SHIELD: "Off Hand / Shield", INVTYPE_SHIELD: "Off Hand / Shield",
  RANGED: "Ranged / Relic", RANGEDRIGHT: "Ranged / Relic", INVTYPE_RANGED: "Ranged / Relic", RELIC: "Ranged / Relic", INVTYPE_RELIC: "Ranged / Relic",
  TWO_HANDED: "Main Hand", TWOHWEAPON: "Main Hand", INVTYPE_2HWEAPON: "Main Hand",
};
export const itemSlotForInventoryType = (inventoryType: string) => slotMap[inventoryType] ?? "Main Hand";
export const weaponHandForInventoryType = (inventoryType: string) => /2H|TWO/i.test(inventoryType) ? "two-hand" as const : "one-hand" as const;

export class BlizzardItemDataProvider implements ItemDataProvider {
  async getItem(region: Region, contentVersion: ContentVersion, realmType: CharacterRealmType, itemId: number) { const result = await this.getItemDiagnostic(region, contentVersion, realmType, itemId); return result.item ?? null; }

  async getItemDiagnostic(region: Region, contentVersion: ContentVersion, realmType: CharacterRealmType, itemId: number): Promise<ItemFetchDiagnostic> {
    const context = getBlizzardContext(realmType, region); const namespace = context.staticNamespace; const key = `${contentVersion}:${realmType}:${region}:${itemId}`;
    const cached = itemCache.get<EquippedItem>(key); if (cached) return { itemId, item: cached, namespace, region, oauthSucceeded: true };
    let token: string;
    try { token = await getBlizzardAccessToken(region); } catch (error) { const message = error instanceof Error ? error.message : "OAuth failed"; return { itemId, reason: message.includes("credentials") ? "missing-credentials" : "oauth-failed", namespace, region, oauthSucceeded: false }; }
    const url = `https://${region}.api.blizzard.com/data/wow/item/${encodeURIComponent(String(itemId))}?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(context.locale)}`;
    let response: Response;
    try { response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(8000) }); } catch { return { itemId, reason: "network-error", namespace, region, oauthSucceeded: true }; }
    if (response.status === 404) return { itemId, reason: "not-found", status: 404, namespace, region, oauthSucceeded: true };
    if (response.status === 401) return { itemId, reason: "unauthorized", status: 401, namespace, region, oauthSucceeded: true };
    if (response.status === 403) return { itemId, reason: "forbidden", status: 403, namespace, region, oauthSucceeded: true };
    if (response.status === 429) return { itemId, reason: "rate-limited", status: 429, namespace, region, oauthSucceeded: true };
    if (response.status >= 400 && response.status < 500) return { itemId, reason: "invalid-namespace", status: response.status, namespace, region, oauthSucceeded: true };
    if (!response.ok) return { itemId, reason: "unknown-error", status: response.status, namespace, region, oauthSucceeded: true };
    let payload: BlizzardItem;
    try { payload = await response.json() as BlizzardItem; } catch { return { itemId, reason: "malformed-response", status: response.status, namespace, region, oauthSucceeded: true }; }
    if (!payload.id || !payload.name) return { itemId, reason: "malformed-response", status: response.status, namespace, region, oauthSucceeded: true };
    try {
      const inventoryType = payload.inventory_type?.type ?? "";
      const dps = typeof payload.weapon?.dps === "number" ? payload.weapon.dps : payload.weapon?.dps?.value;
      const normalized: EquippedItem = {
        itemId: payload.id, name: payload.name, slot: itemSlotForInventoryType(inventoryType), quality: qualityMap[payload.quality?.type?.toUpperCase() ?? ""] ?? "Common", itemLevel: payload.level, icon: "IT",
        stats: Object.fromEntries((payload.stats ?? []).filter((stat) => stat.type?.name).map((stat) => [stat.type!.name!, String(stat.value ?? 0)])),
        ...(payload.weapon?.damage?.min !== undefined && payload.weapon.damage.max !== undefined && payload.weapon.attack_speed !== undefined && dps !== undefined ? { weapon: { damageMin: payload.weapon.damage.min, damageMax: payload.weapon.damage.max, speed: payload.weapon.attack_speed / 1000, dps, hand: weaponHandForInventoryType(inventoryType), weaponType: payload.weapon.type?.type } } : {}),
      };
      itemCache.set(key, normalized, CACHE_TTL.itemMs); return { itemId, item: normalized, namespace, region, oauthSucceeded: true };
    } catch { return { itemId, reason: "normalization-error", status: response.status, namespace, region, oauthSucceeded: true }; }
  }
}

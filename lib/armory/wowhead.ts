import type { CharacterRealmType, ContentVersion } from "../types.ts";
import type { ArmoryItem } from "./types.ts";
export const WOWHEAD_SCRIPT = "https://wow.zamimg.com/js/tooltips.js";
// The actual realm ecosystem wins over the surrounding site's content context.
export function wowheadDataset(_version: ContentVersion, realmType: CharacterRealmType) { return realmType === "era" ? "classic" : "tbc"; }
export function wowheadLink(version: ContentVersion, realmType: CharacterRealmType, type: "item" | "spell", id: number) {
  return Number.isSafeInteger(id) && id > 0 ? `https://www.wowhead.com/${wowheadDataset(version, realmType)}/${type}=${id}` : undefined;
}
export function wowheadItemParams(version: ContentVersion, realmType: CharacterRealmType, item: ArmoryItem) {
  const params = new URLSearchParams({ domain: wowheadDataset(version, realmType), item: String(item.itemId) });
  if (item.enchantIds[0]) params.set("ench", String(item.enchantIds[0]));
  if (item.gemIds.length) params.set("gems", item.gemIds.join(":"));
  return params.toString();
}
export function isTrustedArmoryIcon(value?: string): boolean {
  if (!value) return false;
  if (/^\/images\/armory\/[a-z0-9-]+\.svg$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.search && !url.hash && ["render.worldofwarcraft.com", "wow.zamimg.com"].includes(url.hostname) && /^\/(?:classic-us|classic-eu|us|eu|images\/wow)\/icons\/(?:large|medium|small|56)\/[a-z0-9_-]+\.(?:jpg|png)$/.test(url.pathname); } catch { return false; }
}

import eraRealms from "./era-catalog.json" with { type: "json" };
import { normalizeLookup } from "../characters/normalization.ts";
import type { CharacterRealmType, Region } from "../types.ts";
export type RealmEntry = { id?: number; name: string; slug: string; region: Region; realmType: CharacterRealmType };
// Blizzard's Anniversary realm announcements, excluding Hardcore (not TBC).
const anniversary: RealmEntry[] = [
  { name: "Spineshatter", slug: "spineshatter", region: "eu", realmType: "anniversary" },
  { name: "Thunderstrike", slug: "thunderstrike", region: "eu", realmType: "anniversary" },
  { name: "Nightslayer", slug: "nightslayer", region: "us", realmType: "anniversary" },
  { name: "Dreamscythe", slug: "dreamscythe", region: "us", realmType: "anniversary" },
  { name: "Maladath", slug: "maladath", region: "us", realmType: "anniversary" },
];
export const REALM_CATALOG: RealmEntry[] = [...eraRealms as RealmEntry[], ...anniversary];
export function searchRealms(entries: RealmEntry[], region: Region, realmType: CharacterRealmType, query = "") {
  const term = normalizeLookup(query.trim());
  return entries.filter((realm) => realm.region === region && realm.realmType === realmType && (!term || normalizeLookup(realm.name).includes(term) || realm.slug.includes(term)))
    .sort((a, b) => Number(!normalizeLookup(a.name).startsWith(term)) - Number(!normalizeLookup(b.name).startsWith(term)) || a.name.localeCompare(b.name, "en") || a.slug.localeCompare(b.slug));
}
export function selectedRealm(entries: RealmEntry[], region: Region, realmType: CharacterRealmType, value: string) {
  const key = normalizeLookup(value);
  return entries.find((entry) => entry.region === region && entry.realmType === realmType && entry.slug === key);
}

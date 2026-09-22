import { ERA_RAIDS } from "../warcraft-logs/registry.ts";
import type { ContentVersion } from "../types.ts";
import type { Guide } from "./types.ts";

export const moltenCore = ERA_RAIDS.find(raid => raid.id === 2000)!;
export const blackwingLair = ERA_RAIDS.find(raid => raid.id === 2002)!;
export function raidProgressionEncounters(version: ContentVersion, raidId: number) {
  return version === "era" ? [...(ERA_RAIDS.find(raid => raid.id === raidId)?.encounters ?? [])].filter(boss => boss.progression).sort((a, b) => a.order - b.order) : [];
}
export const moltenCoreEncounters = [...moltenCore.encounters].filter(boss => boss.progression).sort((a, b) => a.order - b.order);
const reviewed = "2026-09-21";
const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// Game names, order and membership come from the accepted identity registry.
export const guideRegistry: readonly Guide[] = [
  { id: "era-blackwing-lair", type: "raid", contentVersion: "era", raidId: blackwingLair.id, bossCoverage: "overview", slug: "raids/blackwing-lair", title: blackwingLair.name, status: "published", updatedAt: "2026-09-22" },
  { id: "era-holy", type: "spec", contentVersion: "era", className: "Priest", specName: "Holy", slug: "classes/priest/holy", title: "Holy Priest", status: "published", updatedAt: "2026-09-22" },
  { id: "era-marksmanship", type: "spec", contentVersion: "era", className: "Hunter", specName: "Marksmanship", slug: "classes/hunter/marksmanship", title: "Marksmanship Hunter", status: "published", updatedAt: reviewed },
  { id: "era-combat", type: "spec", contentVersion: "era", className: "Rogue", specName: "Combat", slug: "classes/rogue/combat", title: "Combat Rogue", status: "published", updatedAt: reviewed },
  { id: "era-frost", type: "spec", contentVersion: "era", className: "Mage", specName: "Frost", slug: "classes/mage/frost", title: "Frost Mage", status: "published", updatedAt: reviewed },
  { id: "era-fury", type: "spec", contentVersion: "era", className: "Warrior", specName: "Fury", slug: "classes/warrior/fury", title: "Fury Warrior", status: "published", updatedAt: reviewed },
  { id: "era-molten-core", type: "raid", contentVersion: "era", raidId: moltenCore.id, slug: "raids/molten-core", title: moltenCore.name, status: "published", updatedAt: reviewed },
  ...moltenCoreEncounters.map((boss): Guide => ({ id: `era-boss-${boss.id}`, type: "boss", contentVersion: "era", raidId: moltenCore.id, encounterId: boss.id, slug: `raids/molten-core/${slugify(boss.name)}`, title: boss.name, status: "published", updatedAt: reviewed })),
];
export function publishedGuides(version?: ContentVersion, entries = guideRegistry) { return entries.filter(guide => guide.status === "published" && (!version || guide.contentVersion === version)); }
export function guideHref(guide: Guide) { return `/${guide.contentVersion}/guides/${guide.slug}`; }
export function resolveGuide(version: string, slug: string, entries = guideRegistry) { return entries.find(guide => guide.status === "published" && guide.contentVersion === version && guide.slug === slug); }
export function specGuide(version: ContentVersion, className: string, specName: string) { return publishedGuides(version).find(guide => guide.type === "spec" && guide.className.toLowerCase() === className.trim().toLowerCase() && guide.specName.toLowerCase() === specName.trim().toLowerCase()); }
export function raidGuide(version: ContentVersion, raidId: number) { return publishedGuides(version).find(guide => guide.type === "raid" && guide.raidId === raidId); }
export function bossGuide(version: ContentVersion, raidId: number, encounterId: number) { return publishedGuides(version).find(guide => guide.type === "boss" && guide.raidId === raidId && guide.encounterId === encounterId); }
export function guideIndexPaths(version: ContentVersion) { return [`/${version}/guides`, `/${version}/guides/classes`, `/${version}/guides/raids`, ...new Set(publishedGuides(version).filter(guide => guide.type === "spec").map(guide => `/${version}/guides/${guide.slug.split("/").slice(0, -1).join("/")}`))]; }
export function publicGuidePaths() { return [...guideIndexPaths("era"), ...guideIndexPaths("tbc"), ...publishedGuides().map(guideHref)]; }

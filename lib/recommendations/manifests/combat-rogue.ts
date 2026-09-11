import { eraCombatRogueCandidates } from "../../gear-analysis/additional-spec-datasets.ts";
import type { ReferenceEntryDecorator } from "../../curated-gear/repository.ts";
import { createCuratedProfile, type SpecAuthoringManifest, type SpecManifestSeed } from "../manifest.ts";
import { rogueCombatRules } from "../rules/rogue-combat.ts";

const seed: SpecManifestSeed = {
  key: "era-rogue-combat", contentVersion: "era", className: "Rogue", specName: "Combat", level: 60, role: "DPS",
  phases: [
    { phase: 0, label: "Pre-Raid", setId: "era-combat-rogue-pre-raid", datasetVersion: "era-combat-rogue-pre-raid-v1", authoringFile: "data/curated/era/rogue/combat/reference.csv", snapshotFile: "data/curated/published/era-combat-rogue-pre-raid-v1.json", acceptedSnapshotSha256: "DB86698B9B5C24873CBBA6FE6CE98BAA1A80B5D885D1419BA85F3A4CA4FAF95D" },
    { phase: 1, label: "Phase 1", setId: "era-combat-rogue-phase-1", datasetVersion: "era-combat-rogue-phase-1-v1", authoringFile: "data/curated/era/rogue/combat/phase-1.csv", snapshotFile: "data/curated/published/era-combat-rogue-phase-1-v1.json", acceptedSnapshotSha256: "1FED54B81F0FFF557CC9CB3D5DFC7FF59DDB1DCC21AEA9B9FCAFCBDF8E7EFD5F" },
  ],
  methodology: "Authored Classic Era Combat Rogue priorities with explicit main-hand/off-hand roles; no stat-weight or DPS simulation is used.",
  provenance: { id: "rogue-classic-era-2026-09", source: "Blizzard Classic item records, Warcraft Wiki item and instance records, and independent PrePull review", sourceUrl: "https://warcraft.wiki.gg/wiki/Category:World_of_Warcraft_Classic_items", reviewedAt: "2026-09-11", reviewedBy: "PrePull data review", verificationStatus: "curated", notes: "Identity, slot, weapon role, source, phase, and practical acquisition classification were reviewed independently." },
  documentationPath: "docs/era-combat-rogue-curated-reference.md", capabilities: { playerAdvice: true, progressTracking: true, sessionPlanner: true },
};
const byId = new Map(eraCombatRogueCandidates.map((item) => [item.itemId, item]));
const decorateEntry: ReferenceEntryDecorator = (entry) => { const role = byId.get(entry.itemId)?.weaponRole; return { ...entry, ...(role ? { weaponContext: `${role.type}; ${role.role}; legal in ${role.allowedSlots.join(" or ")}` } : {}), ...(entry.itemId === 18404 ? { factionSources: { Alliance: "Celebrating Good Times", Horde: "For All To See" } } : {}) }; };
export const combatRogueManifest: SpecAuthoringManifest = { ...seed, profile: createCuratedProfile(seed), candidates: eraCombatRogueCandidates, decorateEntry, ruleModule: rogueCombatRules, includeSingleBestInSlotTargets: true, strictCandidateMetadata: true };

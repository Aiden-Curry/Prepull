import { eraMarksmanshipHunterCandidates } from "../../gear-analysis/additional-spec-datasets.ts";
import type { ReferenceEntryDecorator } from "../../curated-gear/repository.ts";
import { createCuratedProfile, type SpecAuthoringManifest, type SpecManifestSeed } from "../manifest.ts";
import { hunterMarksmanshipRules } from "../rules/hunter-marksmanship.ts";

const seed: SpecManifestSeed = {
  key: "era-hunter-marksman", contentVersion: "era", className: "Hunter", specName: "Marksmanship", level: 60, role: "DPS",
  phases: [
    { phase: 0, label: "Pre-Raid", setId: "era-marksmanship-hunter-pre-raid", datasetVersion: "era-marksmanship-hunter-pre-raid-v1", authoringFile: "data/curated/era/hunter/marksmanship/reference.csv", snapshotFile: "data/curated/published/era-marksmanship-hunter-pre-raid-v1.json", acceptedSnapshotSha256: "59D21BD0AE67C22BE091E7C764C3CD07DF5C2EAC2DB5FF6979030BB174B35EC1" },
    { phase: 1, label: "Phase 1", setId: "era-marksmanship-hunter-phase-1", datasetVersion: "era-marksmanship-hunter-phase-1-v1", authoringFile: "data/curated/era/hunter/marksmanship/phase-1.csv", snapshotFile: "data/curated/published/era-marksmanship-hunter-phase-1-v1.json", acceptedSnapshotSha256: "99345600CADC27BBB93B1AB644F84DCD0CB721FD2B02C1917BFD93BB05B88F98" },
  ],
  methodology: "Authored Classic Era Marksmanship Hunter priorities separating ranged weapons from melee stat-stick choices; no ranged DPS simulation is used.",
  provenance: { id: "hunter-classic-era-2026-09", source: "Blizzard Classic item records, Warcraft Wiki item and instance records, and independent PrePull review", sourceUrl: "https://warcraft.wiki.gg/wiki/Category:World_of_Warcraft_Classic_items", reviewedAt: "2026-09-11", reviewedBy: "PrePull data review", verificationStatus: "curated", notes: "Identity, slot, ranged/melee role, source, phase, and practical acquisition classification were reviewed independently." },
  documentationPath: "docs/era-marksmanship-hunter-curated-reference.md", capabilities: { playerAdvice: true, progressTracking: true, sessionPlanner: true },
};
const byId = new Map(eraMarksmanshipHunterCandidates.map((item) => [item.itemId, item]));
const decorateEntry: ReferenceEntryDecorator = (entry) => { const role = byId.get(entry.itemId)?.weaponRole; return { ...entry, ...(role ? { weaponContext: `${role.type}; ${role.role}; legal in ${role.allowedSlots.join(" or ")}` } : {}), ...(entry.itemId === 18404 ? { factionSources: { Alliance: "Celebrating Good Times", Horde: "For All To See" } } : {}) }; };
export const marksmanshipHunterManifest: SpecAuthoringManifest = { ...seed, profile: createCuratedProfile(seed), candidates: eraMarksmanshipHunterCandidates, decorateEntry, ruleModule: hunterMarksmanshipRules, includeSingleBestInSlotTargets: true, strictCandidateMetadata: true };

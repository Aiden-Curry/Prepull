import { eraHolyPriestCandidates } from "../../gear-analysis/additional-spec-datasets.ts";
import type { ReferenceEntryDecorator } from "../../curated-gear/repository.ts";
import { createCuratedProfile, type SpecAuthoringManifest, type SpecManifestSeed } from "../manifest.ts";

const seed: SpecManifestSeed = {
  key: "era-priest-holy", contentVersion: "era", className: "Priest", specName: "Holy", level: 60, role: "Healer",
  phases: [
    { phase: 0, label: "Pre-Raid", setId: "era-holy-priest-pre-raid", datasetVersion: "era-holy-priest-pre-raid-v1", authoringFile: "data/curated/era/priest/holy/reference.csv", snapshotFile: "data/curated/published/era-holy-priest-pre-raid-v1.json", acceptedSnapshotSha256: "E76C2F1D45E6152FAC6F16025F7E59A29CBD048C6CC10FC27D3B472644B9EC38" },
    { phase: 1, label: "Phase 1", setId: "era-holy-priest-phase-1", datasetVersion: "era-holy-priest-phase-1-v1", authoringFile: "data/curated/era/priest/holy/phase-1.csv", snapshotFile: "data/curated/published/era-holy-priest-phase-1-v1.json", acceptedSnapshotSha256: "F334D284D25D92C4BF424A50E8A005F457665B2DC3C31FA78477464473796E7F" },
  ],
  methodology: "Authored Classic Era Holy Priest healing and mana-sustain priorities with one-hand/off-hand, staff, and wand paths; no healing simulation is used.",
  provenance: { id: "priest-classic-era-2026-09", source: "Blizzard Classic item records, Warcraft Wiki item and instance records, and independent PrePull review", sourceUrl: "https://warcraft.wiki.gg/wiki/Category:World_of_Warcraft_Classic_items", reviewedAt: "2026-09-11", reviewedBy: "PrePull data review", verificationStatus: "curated", notes: "Identity, slot, healing context, source, phase, and practical acquisition classification were reviewed independently." },
  documentationPath: "docs/era-holy-priest-curated-reference.md", capabilities: { playerAdvice: true, progressTracking: true, sessionPlanner: true },
};
const byId = new Map(eraHolyPriestCandidates.map((item) => [item.itemId, item]));
const decorateEntry: ReferenceEntryDecorator = (entry) => { const role = byId.get(entry.itemId)?.weaponRole; return role ? { ...entry, weaponContext: `${role.type}; ${role.hand}; legal in ${role.allowedSlots.join(" or ")}` } : entry; };
export const holyPriestManifest: SpecAuthoringManifest = { ...seed, profile: createCuratedProfile(seed), candidates: eraHolyPriestCandidates, decorateEntry, includeSingleBestInSlotTargets: true, strictCandidateMetadata: true };

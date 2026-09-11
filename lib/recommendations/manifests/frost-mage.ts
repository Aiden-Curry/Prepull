import { eraFrostMageCuratedProfile } from "../../curated-gear/mage-data.ts";
import { eraFrostMageCandidates } from "../../gear-analysis/mage-dataset.ts";
import type { SpecAuthoringManifest } from "../manifest.ts";

export const frostMageManifest: SpecAuthoringManifest = {
  key: "era-mage-frost", contentVersion: "era", className: "Mage", specName: "Frost", level: 60, role: "DPS",
  phases: [
    { phase: 0, label: "Pre-Raid", setId: "era-frost-mage-pre-raid", datasetVersion: "era-frost-mage-pre-raid-v1", authoringFile: "data/curated/era/mage/frost/reference.csv", snapshotFile: "data/curated/published/era-frost-mage-pre-raid-v1.json", acceptedSnapshotSha256: "0345530F92C430D0EF5242FF717A72480D249EA9775C70D5E69A27E90F1740AF" },
    { phase: 1, label: "Phase 1", setId: "era-frost-mage-phase-1", datasetVersion: "era-frost-mage-phase-1-v1", authoringFile: "data/curated/era/mage/frost/phase-1.csv", snapshotFile: "data/curated/published/era-frost-mage-phase-1-v1.json", acceptedSnapshotSha256: "B5E8CF6DFC24FDF7E9818AF2A9D119C1D165C731F225270D0560768A08D61EB1" },
  ],
  methodology: eraFrostMageCuratedProfile.methodology,
  provenance: { id: "mage-classic-era-2026-09", source: "Blizzard static Classic API and Warcraft Wiki Classic item records", sourceUrl: "https://warcraft.wiki.gg/wiki/Category:World_of_Warcraft_Classic_items", reviewedAt: "2026-09-11", reviewedBy: "PrePull data review", verificationStatus: "curated", notes: "Item identity, slot and acquisition paths were reviewed. Priority is curated and is not a simulated DPS score." },
  documentationPath: "docs/era-frost-mage-curated-reference.md",
  capabilities: { playerAdvice: true, progressTracking: true, sessionPlanner: true },
  profile: eraFrostMageCuratedProfile, candidates: eraFrostMageCandidates, includeSingleBestInSlotTargets: true,
};

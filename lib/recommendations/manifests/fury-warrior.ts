import { eraFuryCuratedProfile } from "../../curated-gear/data.ts";
import { decorateFuryReferenceEntry } from "../../curated-gear/repository.ts";
import { eraFuryCandidates } from "../../gear-analysis/dataset.ts";
import type { SpecAuthoringManifest } from "../manifest.ts";
import { furyWarriorRules } from "../rules/fury-warrior.ts";

export const furyWarriorManifest: SpecAuthoringManifest = {
  key: "era-warrior-fury", contentVersion: "era", className: "Warrior", specName: "Fury", level: 60, role: "DPS",
  phases: [
    { phase: 0, label: "Pre-Raid", setId: "era-fury-pre-raid", datasetVersion: "era-fury-pre-raid-v1", authoringFile: "data/curated/era/warrior/fury/reference.csv", snapshotFile: "data/curated/published/era-fury-pre-raid-v1.json", acceptedSnapshotSha256: "62D0F74E8F3AF378049829B01130E91AB7EA920776BB9E9FF8499A3443A82F0F" },
    { phase: 1, label: "Phase 1", setId: "era-fury-phase-1", datasetVersion: "era-fury-phase-1-v1", authoringFile: "data/curated/era/warrior/fury/phase-1.csv", snapshotFile: "data/curated/published/era-fury-phase-1-v1.json", acceptedSnapshotSha256: "9474C7C288F4910F5DE5C9DAE849B16800B20CFB3ED20C94CBA4DD73239A9D16" },
  ],
  methodology: eraFuryCuratedProfile.methodology,
  provenance: { id: "prepull-curated-2026-08", source: "PrePull curated Classic Era reference dataset", reviewedAt: "2026-08-12", reviewedBy: "PrePull data review", verificationStatus: "curated", notes: "Structured conclusions only; no numerical DPS claim." },
  documentationPath: "data/curated/README.md",
  capabilities: { playerAdvice: true, progressTracking: true, sessionPlanner: true },
  profile: eraFuryCuratedProfile, candidates: eraFuryCandidates, decorateEntry: decorateFuryReferenceEntry, ruleModule: furyWarriorRules,
};

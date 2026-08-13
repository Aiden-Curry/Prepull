import type { CuratedReferenceProfile, ReferenceGearSet } from "./types.ts";

export type EraFuryProgressionStep = { id: string; phase: number; label: string };
export const eraFuryProgression: readonly EraFuryProgressionStep[] = [
  { id: "era-fury-pre-raid", phase: 0, label: "pre-raid" },
  { id: "era-fury-phase-1", phase: 1, label: "phase-1" },
  { id: "era-fury-phase-2", phase: 2, label: "phase-2" },
  { id: "era-fury-phase-3", phase: 3, label: "phase-3" },
  { id: "era-fury-phase-4", phase: 4, label: "phase-4" },
  { id: "era-fury-phase-5", phase: 5, label: "phase-5" },
  { id: "era-fury-phase-6", phase: 6, label: "phase-6" },
];
export const progressionPhaseForSet = (set: Pick<ReferenceGearSet, "id" | "phase">) => eraFuryProgression.find((step) => step.id === set.id)?.phase ?? set.phase;
export const setForPhase = (profile: CuratedReferenceProfile, phase: number) => profile.sets.find((set) => progressionPhaseForSet(set) === phase);

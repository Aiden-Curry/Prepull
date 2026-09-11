import type { CharacterSource } from "../types.ts";
import { additionalSpecCandidates } from "../gear-analysis/additional-spec-datasets.ts";

export type ClassicContentPhase = 1 | 2 | 3 | 4 | 5 | 6;
export type AvailabilityEvidence = "verified" | "curated" | "needs-review";
export type PhaseSourceRecord = { phaseFrom: ClassicContentPhase; phaseUntil?: ClassicContentPhase; source: CharacterSource; evidence: AvailabilityEvidence };
export type ItemAvailability = { availableFromPhase: ClassicContentPhase; availableUntilPhase?: ClassicContentPhase; sources?: PhaseSourceRecord[]; evidence: AvailabilityEvidence; notes?: string };
export type AvailabilityRow = { itemId: number; phase: ClassicContentPhase; eligible: boolean };

// This is deliberately keyed metadata, never inferred from an item ID range.
const phaseOneItems = [12640, 13404, 12587, 15411, 17044, 11933, 12927, 12082, 16733, 13340, 11626, 13397, 11726, 14637, 13944, 12936, 13400, 13211, 12966, 15063, 14551, 13957, 13142, 13959, 13502, 14554, 15062, 16732, 14616, 12555, 13967, 13098, 17713, 2246, 12548, 13217, 11815, 13965, 19120, 11684, 12940, 811, 12590, 12939, 871, 15806, 13015, 12653, 12651, 18817, 18404, 19146, 19143, 19137, 18821, 17063, 17075, 17068, 18832, 18805, 18816, 18823, 17069, 17072];
const phaseTwoItems = [18500, 18380, 18323];
const frostMagePhaseOneItems = [
  18727, 12103, 11782, 11623, 14152, 18497, 13253, 11662, 13170, 11822,
  12543, 12545, 13001, 16058, 12930, 13968, 13964, 18534, 11904, 13938,
  16795, 17109, 16797, 17078, 19145, 16799, 16801, 19136, 16915, 16800,
  19147, 19138, 18820, 17103, 18842, 17077,
];
export const classicItemAvailability: ReadonlyMap<number, ItemAvailability> = new Map<number, ItemAvailability>([
  ...additionalSpecCandidates.map((item) => [item.itemId, { availableFromPhase: Math.max(1, item.availability.phase) as ClassicContentPhase, evidence: "curated" as const }] as const),
  ...phaseOneItems.map((itemId) => [itemId, { availableFromPhase: 1, evidence: "curated" as const }] as const),
  ...phaseTwoItems.map((itemId) => [itemId, { availableFromPhase: 2, evidence: "curated" as const }] as const),
  ...frostMagePhaseOneItems.map((itemId) => [itemId, { availableFromPhase: 1, evidence: "curated" as const }] as const),
  [20130, { availableFromPhase: 3, evidence: "verified", notes: "Warrior level-50 class quest reward becomes available with the Phase 3 class-quest release." }],
  [22385, { availableFromPhase: 6, evidence: "verified", notes: "Mature-era crafted item; recipe availability is treated as Phase 6/current in this model." }],
  [19325, { availableFromPhase: 2, evidence: "verified", notes: "Alterac Valley reputation reward; available when Alterac Valley opens in the phased model." }],
  [21180, { availableFromPhase: 5, evidence: "verified", notes: "Cenarion Circle/Silithus Field Duty reward." }],
  [21182, { availableFromPhase: 5, evidence: "verified", notes: "Cenarion Circle reputation reward." }],
  [15050, { availableFromPhase: 3, evidence: "curated", notes: "Black Dragon Mail mature-era crafted set." }],
  [15051, { availableFromPhase: 3, evidence: "curated", notes: "Black Dragon Mail mature-era crafted set." }],
  [15052, { availableFromPhase: 3, evidence: "curated", notes: "Black Dragon Mail mature-era crafted set." }],
] as [number, ItemAvailability][]);

export const phaseAwareSources: ReadonlyMap<number, readonly PhaseSourceRecord[]> = new Map([
  [11815, [
    { phaseFrom: 1, phaseUntil: 4, source: { type: "Dungeon", instance: "Blackrock Depths", boss: "General Angerforge" }, evidence: "curated" },
    { phaseFrom: 5, source: { type: "Dungeon", instance: "Blackrock Depths", boss: "Emperor Dagran Thaurissan" }, evidence: "verified" },
  ]],
]);

export function availabilityFor(itemId: number): ItemAvailability | undefined { return classicItemAvailability.get(itemId); }
export function isAvailableInPhase(itemId: number, phase: ClassicContentPhase): boolean { const availability = availabilityFor(itemId); return Boolean(availability && availability.availableFromPhase <= phase && (availability.availableUntilPhase === undefined || phase <= availability.availableUntilPhase)); }
export function sourceForPhase(itemId: number, phase: ClassicContentPhase): CharacterSource | undefined { const records = phaseAwareSources.get(itemId); return records?.find((record) => record.phaseFrom <= phase && (record.phaseUntil === undefined || phase <= record.phaseUntil))?.source; }
export function resolvedPhaseForSet(setPhase: number): ClassicContentPhase { return (setPhase === 0 ? 6 : Math.min(6, Math.max(1, setPhase))) as ClassicContentPhase; }
export function availabilitySummary(itemIds: readonly number[], phase: ClassicContentPhase) { const rows: AvailabilityRow[] = itemIds.map((itemId) => ({ itemId, phase, eligible: isAvailableInPhase(itemId, phase) })); const eligibleIds = new Set(rows.filter((row) => row.eligible).map((row) => row.itemId)); const unavailableIds = new Set(rows.filter((row) => !row.eligible).map((row) => row.itemId)); return { rows, canonicalRows: rows.length, eligibleRows: rows.filter((row) => row.eligible).length, unavailableRows: rows.filter((row) => !row.eligible).length, eligibleUniqueItems: eligibleIds.size, unavailableUniqueItems: unavailableIds.size }; }

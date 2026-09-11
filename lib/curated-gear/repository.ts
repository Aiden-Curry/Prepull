import fs from "node:fs";
import path from "node:path";
import { eraFuryCuratedProfile } from "./data.ts";
import type { CuratedReferenceProfile, ReferenceGearSet, ReferenceItemEntry } from "./types.ts";

export const generatedCuratedPath = path.resolve("data/curated/generated/imported-reference.json");
type GeneratedSet = ReferenceGearSet & { className: string; specialization: string };
export type ReferenceEntryDecorator = (entry: ReferenceItemEntry, set: ReferenceGearSet) => ReferenceItemEntry;

const phaseOneUniqueIds = new Set([17075, 18832, 18805, 18816, 17063, 18821]);
const phaseOneReview: Record<number, ReferenceItemEntry["reviewDecision"]> = { 18817: "approved-conditional", 18404: "approved", 19146: "approved", 19143: "approved-conditional", 18823: "approved-conditional", 19137: "approved", 18821: "approved", 17063: "approved-conditional", 17075: "approved-conditional", 17068: "approved-conditional", 18832: "approved", 18805: "approved-conditional", 18816: "approved-conditional", 17069: "approved", 17072: "approved" };

export const decorateFuryReferenceEntry: ReferenceEntryDecorator = (entry, set) => ({
  ...entry,
  ...(set.id === "era-fury-phase-1" ? {
    origin: "phase-1-addition" as const,
    reviewDecision: phaseOneReview[entry.itemId] ?? "review-required",
    ...(entry.source.type === "Raid" || entry.itemId === 18404 ? { raidOrigin: true, requiresRaidContent: true } : {}),
    ...(phaseOneUniqueIds.has(entry.itemId) ? { uniqueGroup: `unique:${entry.itemId}` } : {}),
    ...(entry.itemId === 18404 ? { factionSources: { Alliance: "Celebrating Good Times", Horde: "For All To See" }, source: { ...entry.source, instance: "Onyxia's Lair", quest: "Head of Onyxia" } } : {}),
    ...(entry.itemId === 18823 ? { weaponContext: "Dagger +5", conditionalEffects: ["+5 dagger skill", "1% critical strike"] } : {}),
    ...(entry.itemId === 18816 ? { weaponContext: "One-hand dagger; Main Hand or Off Hand" } : {}),
  } : {}),
});

const decorateDefaultReferenceEntry: ReferenceEntryDecorator = (entry, set) => ({
  ...entry,
  ...(set.phase > 0 ? { origin: "phase-1-addition" as const } : {}),
  ...(entry.source.type === "Raid" ? { raidOrigin: true, requiresRaidContent: true } : {}),
  ...([13001, 16058, 12930, 13968, 19147, 19138, 18820].includes(entry.itemId) ? { uniqueGroup: `unique:${entry.itemId}` } : {}),
  ...([18534, 18842].includes(entry.itemId) ? { weaponContext: "Two-handed weapon; off-hand slot is unavailable while equipped." } : {}),
  ...(entry.itemId === 14152 ? { requiresProfession: "Tailoring", professionRequirements: ["Tailoring 300"] } : {}),
});

function readGeneratedSets(): GeneratedSet[] {
  if (!fs.existsSync(generatedCuratedPath)) return [];
  try { const value = JSON.parse(fs.readFileSync(generatedCuratedPath, "utf8")) as GeneratedSet[]; return Array.isArray(value) ? value : []; } catch { return []; }
}

function normalizeSet(set: GeneratedSet, metadata: ReferenceGearSet | undefined, profile: CuratedReferenceProfile, decorateEntry: ReferenceEntryDecorator): ReferenceGearSet {
  return {
    ...metadata,
    ...set,
    id: set.id,
    className: metadata?.className ?? profile.className,
    specialization: metadata?.specialization ?? profile.specialization,
    name: metadata?.name ?? set.name,
    context: metadata?.context ?? set.context,
    referenceFrame: metadata?.referenceFrame ?? (set.phase === 0 ? "progression-era" : "current-era"),
    description: metadata?.description ?? set.description,
    methodology: metadata?.datasetVersion === "era-fury-pre-raid-v1" ? "Curated Reference" : metadata?.methodology ?? set.methodology,
    sourceProvenance: set.sourceProvenance,
    complete: metadata?.complete ?? set.complete,
    status: metadata?.status ?? set.status,
    publishedAt: metadata?.publishedAt,
    datasetVersion: metadata?.datasetVersion,
    changelog: metadata?.changelog,
    allowedRaidSources: metadata?.allowedRaidSources ?? set.allowedRaidSources,
    composition: metadata?.composition ?? set.composition,
    slots: Object.fromEntries(Object.entries(set.slots).map(([slot, entries]) => [slot, (entries ?? []).map((entry) => decorateEntry(entry as ReferenceItemEntry, set))])),
  };
}

const compose = (set: ReferenceGearSet, all: ReferenceGearSet[]): ReferenceGearSet => {
  const composition = set.composition; const baseId = composition?.baseSetId;
  if (!composition || !baseId) return set;
  if (baseId === set.id) throw new Error(`Circular curated composition: ${set.id} inherits itself.`);
  const base = all.find((candidate) => candidate.id === baseId);
  if (!base) throw new Error(`Missing curated composition base ${baseId} for ${set.id}.`);
  if (base.composition?.baseSetId === set.id) throw new Error(`Circular curated composition: ${set.id} <-> ${base.id}.`);
  const exclusions = new Set(composition.exclusions ?? []); const slots: ReferenceGearSet["slots"] = {};
  for (const [slot, entries] of Object.entries(base.slots)) slots[slot as keyof ReferenceGearSet["slots"]] = (entries ?? []).filter((entry) => !exclusions.has(entry.itemId)).map((entry) => ({ ...entry, origin: "inherited" }));
  for (const [slot, entries] of Object.entries(set.slots)) slots[slot as keyof ReferenceGearSet["slots"]] = [...(slots[slot as keyof ReferenceGearSet["slots"]] ?? []), ...(entries ?? [])];
  return { ...set, slots, composition: { ...composition, setId: composition.setId ?? set.id, additions: Object.values(set.slots).flatMap((entries) => entries ?? []) }, description: `${set.description} Composed from ${base.id} without mutating the base set.` };
};

export class CuratedReferenceRepository {
  private readonly profile: CuratedReferenceProfile;
  private readonly decorateEntry: ReferenceEntryDecorator;
  constructor(profile: CuratedReferenceProfile = eraFuryCuratedProfile, decorateEntry?: ReferenceEntryDecorator) { this.profile = profile; this.decorateEntry = decorateEntry ?? (profile.id === eraFuryCuratedProfile.id ? decorateFuryReferenceEntry : decorateDefaultReferenceEntry); }
  getProfile(): CuratedReferenceProfile {
    const generated = readGeneratedSets().filter((set) => set.contentVersion === this.profile.contentVersion && set.className.toLowerCase() === this.profile.className.toLowerCase() && set.specialization.toLowerCase() === this.profile.specialization.toLowerCase());
    if (!generated.length) throw new Error(`Generated curated reference data is missing for ${this.profile.className} ${this.profile.specialization}: ${generatedCuratedPath}`);
    const metadata = new Map(this.profile.sets.map((set) => [set.id, set]));
    const normalized = generated.map((set) => normalizeSet(set, metadata.get(set.id), this.profile, this.decorateEntry));
    const generatedIds = new Set(normalized.map((set) => set.id)); const shells = this.profile.sets.filter((set) => !generatedIds.has(set.id)); const all = [...normalized, ...shells]; const sets = all.map((set) => compose(set, all));
    return { ...this.profile, defaultSetId: sets.some((set) => set.id === this.profile.defaultSetId) ? this.profile.defaultSetId : sets[0]?.id ?? this.profile.defaultSetId, sets };
  }
  getSets() { return this.getProfile().sets; }
  getSet(setId: string) { return this.getSets().find((set) => set.id === setId); }
}

export const curatedReferenceRepository = new CuratedReferenceRepository();
export const getCanonicalCuratedProfile = () => curatedReferenceRepository.getProfile();

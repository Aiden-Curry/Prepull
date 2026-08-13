import { getCanonicalCuratedProfile } from "../lib/curated-gear/repository.ts";
import { normalizedItemMetadata } from "../lib/item-metadata/store.ts";
import { availabilityFor, isAvailableInPhase, resolvedPhaseForSet, sourceForPhase, type ClassicContentPhase } from "../lib/curated-gear/availability.ts";
import { arg } from "./curated-common.ts";

const profile = getCanonicalCuratedProfile();
const metadata = normalizedItemMetadata();
const phase = arg("phase") ?? "pre-raid";
const phaseNumber = phase === "pre-raid" ? 0 : Number(phase.replace("phase-", ""));
const set = profile.sets.find((candidate) => candidate.phase === phaseNumber && (!arg("class") || candidate.className.toLowerCase() === arg("class")!.toLowerCase()) && (!arg("spec") || candidate.specialization.toLowerCase() === arg("spec")!.toLowerCase()));
if (!set) { console.error(`No canonical curated set found for ${phase}.`); process.exit(1); }
const requested = arg("availability-phase");
const availabilityPhase: ClassicContentPhase = requested === "mature" || !requested ? resolvedPhaseForSet(set.phase) : Number(requested.replace("phase-", "")) as ClassicContentPhase;
let eligibleRows = 0;
let unavailableRows = 0;
for (const group of new Map(Object.entries(set.slots)).values()) { if (!group?.length) continue; console.log(`\n${group[0].slot.toUpperCase()}`); for (const entry of group) { const item = metadata.get(entry.itemId); const eligible = isAvailableInPhase(entry.itemId, availabilityPhase); const source = sourceForPhase(entry.itemId, availabilityPhase) ?? entry.source; if (eligible) eligibleRows += 1; else unavailableRows += 1; console.log(`${item?.name ?? `UNRESOLVED ITEM #${entry.itemId}`} (#${entry.itemId})${eligible ? "" : `\n   Status: unavailable\n   Available from: Phase ${availabilityFor(entry.itemId)?.availableFromPhase ?? "unknown"}`}\n   Tier: ${entry.tier}\n   Source: ${source.instance ?? source.zone ?? source.quest ?? source.type}${source.boss ? ` — ${source.boss}` : ""}\n   Origin: ${entry.origin ?? "unmarked"}\n   Verification: ${entry.provenance.verificationStatus}`); } }
const canonicalRows = Object.values(set.slots).reduce((count, entries) => count + (entries?.length ?? 0), 0);
console.log(`\nCanonical set: ${set.name}`);
if (set.composition) {
  const inherited = Object.values(set.slots).flatMap((entries) => entries ?? []).filter((entry) => entry.origin === "inherited").length;
  const additions = Object.values(set.slots).flatMap((entries) => entries ?? []).filter((entry) => entry.origin === "phase-1-addition").length;
  console.log(`Base set: ${set.composition.baseSetId ?? "none"}`);
  console.log(`Inherited rows: ${inherited}`);
  console.log(`Phase 1 overlay rows: ${additions}`);
  console.log(`Final composed recommendations: ${canonicalRows}`);
  console.log(`Raid sources: ${(set.allowedRaidSources ?? []).join(", ") || "none"}`);
}
console.log(`Availability phase: ${requested ?? `phase-${availabilityPhase}`}`);
console.log(`Canonical rows: ${canonicalRows}`);
console.log(`Eligible rows: ${eligibleRows}`);
console.log(`Unavailable rows: ${unavailableRows}`);

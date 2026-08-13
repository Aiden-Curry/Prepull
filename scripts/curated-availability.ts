import { getCanonicalCuratedProfile } from "../lib/curated-gear/repository.ts";
import { normalizedItemMetadata } from "../lib/item-metadata/store.ts";
import { availabilityFor, availabilitySummary, isAvailableInPhase, phaseAwareSources, type ClassicContentPhase } from "../lib/curated-gear/availability.ts";
import { matureFuryCandidates } from "../lib/curated-gear/candidates.ts";

const profile = getCanonicalCuratedProfile();
const set = profile.sets.find((entry) => entry.id === "era-fury-pre-raid")!;
const rows = Object.values(set.slots).flatMap((entries) => entries ?? []);
const metadata = normalizedItemMetadata();
console.log("FURY PRE-RAID PHASE AVAILABILITY AUDIT (READ-ONLY)");
console.log(`Rows: ${rows.length}; set status: ${set.status}; publishable: NO`);

for (const phase of [1, 2, 3, 4, 5, 6] as ClassicContentPhase[]) {
  const summary = availabilitySummary(rows.map((row) => row.itemId), phase);
  if (summary.eligibleRows + summary.unavailableRows !== summary.canonicalRows) throw new Error(`Availability invariant failed for Phase ${phase}.`);
  console.log(`\nPHASE ${phase}: canonical=${summary.canonicalRows} eligibleRows=${summary.eligibleRows} unavailableRows=${summary.unavailableRows} eligibleUnique=${summary.eligibleUniqueItems} unavailableUnique=${summary.unavailableUniqueItems}`);
  for (const row of rows) {
    const availability = availabilityFor(row.itemId);
    const sources = phaseAwareSources.get(row.itemId);
    console.log(`${row.slot} rank=${row.rank ?? "unknown"} #${row.itemId} ${metadata.get(row.itemId)?.name ?? "UNKNOWN"} | from=Phase ${availability?.availableFromPhase ?? "unknown"} | until=Phase ${availability?.availableUntilPhase ?? "none"} | eligible=${isAvailableInPhase(row.itemId, phase) ? "YES" : "NO"}${sources ? " | source-changes=YES" : " | source-changes=NO"}`);
  }
}

console.log("\nAPPROVED PHASE 5.2H CANDIDATES (ALREADY APPROVED; AVAILABILITY ONLY)");
for (const itemId of [22385, 20130, 19325, 21180, 21182, 15050, 15051, 15052]) {
  const candidate = matureFuryCandidates.find((entry) => entry.itemId === itemId) ?? matureFuryCandidates.find((entry) => entry.item === "Black Dragonscale Mail");
  const availability = availabilityFor(itemId);
  console.log(`${metadata.get(itemId)?.name ?? candidate?.item ?? `#${itemId}`} (#${itemId}) | earliest: Phase ${availability?.availableFromPhase ?? "unknown"} | content type: ${candidate?.sourceContentType ?? "crafted"} | raid origin: ${candidate?.raidOrigin ? "YES" : "NO"} | evidence: ${availability?.evidence ?? "missing"}`);
}

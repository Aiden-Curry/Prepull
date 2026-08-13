import { matureFuryCandidates } from "../lib/curated-gear/candidates.ts";
import { getCanonicalCuratedProfile } from "../lib/curated-gear/repository.ts";

const args = process.argv.slice(2);
const profile = getCanonicalCuratedProfile();
const current = profile.sets.find((set) => set.id === "era-fury-pre-raid")!;
const importedIds = new Set(Object.values(current.slots).flatMap((entries) => entries ?? []).map((entry) => entry.itemId));
const groups: Record<string, typeof matureFuryCandidates> = { "STRONG ADD CANDIDATES": [], "CONDITIONAL ADD CANDIDATES": [], "PROBABLY REDUNDANT": [], "EXCLUDED — RAID ORIGIN": [], "NEEDS MORE EVIDENCE": [] };
for (const candidate of matureFuryCandidates) { const key = candidate.disposition === "strong-add" ? "STRONG ADD CANDIDATES" : candidate.disposition === "conditional-add" ? "CONDITIONAL ADD CANDIDATES" : candidate.disposition === "redundant" ? "PROBABLY REDUNDANT" : candidate.disposition === "raid-origin" ? "EXCLUDED — RAID ORIGIN" : "NEEDS MORE EVIDENCE"; groups[key].push(candidate); }
console.log("MATURE ERA FURY PRE-RAID CANDIDATE RECONCILIATION (READ-ONLY)");
console.log(`Current rows: ${Object.values(current.slots).flatMap((entries) => entries ?? []).length}`);
console.log("Mutation: NONE; reference.csv was not changed.");
for (const [group, candidates] of Object.entries(groups)) { console.log(`\n## ${group}`); for (const candidate of candidates) { console.log(`\n${candidate.item}${candidate.itemId ? ` (#${candidate.itemId})` : ""}`); console.log(`Imported in current set: ${candidate.itemId && importedIds.has(candidate.itemId) ? "YES" : "NO"}`); console.log(`Slot: ${candidate.slot}`); console.log(`Source: ${candidate.source}`); console.log(`Original source content type: ${candidate.sourceContentType}`); console.log(`Raid origin: ${candidate.raidOrigin ? "YES" : "NO"}`); console.log(`Requires raid participation: ${candidate.requiresRaidParticipation ? "YES" : "NO"}`); console.log(`Tradeable: ${candidate.tradeable ? "YES" : "NO"}`); console.log(`Faction: ${candidate.faction}`); console.log(`Race context: ${candidate.raceContext}`); console.log(`Profession context: ${candidate.professionContext}`); console.log(`Set dependency: ${candidate.setDependency}`); console.log(`Accessibility: ${candidate.accessibility}`); console.log(`Why Fury cares: ${candidate.whyFuryCares}`); console.log(`Already represented by equivalent option: ${candidate.equivalent ? "YES" : "NO"}`); console.log(`Proposed action: ${candidate.disposition.toUpperCase()}`); if (candidate.proposedTier) console.log(`Proposed tier: ${candidate.proposedTier}`); if (candidate.proposedPosition) console.log(`Proposed rough position: ${candidate.proposedPosition}`); console.log(`Ultimate-target eligible: ${candidate.ultimateTarget === undefined ? "UNDECIDED" : candidate.ultimateTarget ? "YES" : "NO"}`); console.log(`Realistic-target eligible: ${candidate.realisticTarget === undefined ? "UNDECIDED" : candidate.realisticTarget ? "YES" : "NO"}`); console.log(`Evidence: ${candidate.evidence.join("; ")}`); } }
console.log("\n## GAP SUMMARY");
console.log(`Strong add candidates: ${groups["STRONG ADD CANDIDATES"].length}`);
console.log(`Conditional add candidates: ${groups["CONDITIONAL ADD CANDIDATES"].length}`);
console.log(`Redundant candidates: ${groups["PROBABLY REDUNDANT"].length}`);
console.log(`Raid-origin exclusions: ${groups["EXCLUDED — RAID ORIGIN"].length}`);
console.log(`Needs review: ${groups["NEEDS MORE EVIDENCE"].length}`);
console.log("Projected row count after approved additions: not estimated until human approval and exact slot/rank decisions.");
console.log("Status: draft; Publishable: NO");
if (args.includes("--class") || args.includes("--spec") || args.includes("--phase")) console.log("Filters are accepted for command compatibility; this queue is currently the Era Fury Pre-Raid review set.");

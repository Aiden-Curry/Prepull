import { getCanonicalCuratedProfile } from "../lib/curated-gear/repository.ts";
import { publishReport } from "../lib/curated-gear/publish.ts";
import { normalizedItemMetadata } from "../lib/item-metadata/store.ts";
import { referenceSlots } from "../lib/curated-gear/data.ts";
import type { ReferenceItemEntry } from "../lib/curated-gear/types.ts";

const profile = getCanonicalCuratedProfile();
const set = profile.sets.find((entry) => entry.id === "era-fury-pre-raid")!;
const metadata = normalizedItemMetadata();
const rows = referenceSlots.flatMap((slot) => (set.slots[slot] ?? []).map((entry, index) => ({ slot, rank: index + 1, entry })));
const nameFor = (entry: ReferenceItemEntry) => metadata.get(entry.itemId)?.name ?? `Unknown item #${entry.itemId}`;
const sourceFor = (entry: ReferenceItemEntry) => entry.source.instance ?? entry.source.zone ?? entry.source.quest ?? entry.source.profession ?? entry.source.type;
const activityFor = (entry: ReferenceItemEntry) => entry.source.instance ?? entry.source.zone ?? entry.source.type;
const flagsFor = (entry: ReferenceItemEntry) => {
  const flags: string[] = [];
  const source = entry.source;
  if (source.type === "World Drop") flags.push("ACCESSIBILITY REVIEW REQUIRED: rare/expensive world drop; do not assume best realistic target.");
  if (source.type === "Profession" || entry.professionRequirements?.length) flags.push("ACCESSIBILITY REVIEW REQUIRED: profession or crafted acquisition.");
  if (["Main Hand", "Off Hand / Shield"].includes(entry.slot)) flags.push("RACE/WEAPON REVIEW REQUIRED: practical value depends on weapon type, race skill, and paired weapon context.");
  if (["Edgemaster's Handguards", "Devilsaur Gauntlets", "Devilsaur Leggings"].includes(nameFor(entry))) flags.push("CONTEXT REVIEW REQUIRED: weapon-skill or paired-set dependency.");
  if (entry.faction) flags.push("FACTION REVIEW REQUIRED: verify availability for the character faction.");
  if (entry.uniqueGroup) flags.push("PAIRING REVIEW REQUIRED: unique/paired-slot interaction.");
  if (!source.type || (!source.instance && !source.zone && !source.quest && !source.profession && source.type !== "World Drop") ) flags.push("SOURCE REVIEW REQUIRED: acquisition detail is incomplete.");
  return flags;
};
const reviewStatus = (entry: ReferenceItemEntry, flags: string[]) => flags.length ? "review-required" : entry.provenance.verificationStatus === "disputed" ? "disputed" : "reviewed";
console.log("FURY PRE-RAID FINAL DATA REVIEW (READ-ONLY)");
console.log(`Set: ${set.name}`);
const publication = publishReport(set);
console.log(`Status: ${set.status ?? "incomplete"}`);
console.log(`Publishable: ${publication.publishable ? "YES" : "NO"}`);
console.log(`Rows: ${rows.length}; Unique items: ${new Set(rows.map(({ entry }) => entry.itemId)).size}; Slots: ${referenceSlots.filter((slot) => (set.slots[slot]?.length ?? 0) > 0).length}/${referenceSlots.length}`);
for (const slot of referenceSlots) {
  console.log(`\n## ${slot}`);
  for (const row of rows.filter((candidate) => candidate.slot === slot)) {
    const { entry } = row;
    const flags = flagsFor(entry);
    console.log(`${row.rank}. ${nameFor(entry)} (#${entry.itemId}) | tier=${entry.tier} | source=${sourceFor(entry)} | activity=${activityFor(entry)} | boss/quest/vendor=${entry.source.boss ?? entry.source.quest ?? entry.source.npc ?? entry.source.profession ?? "not stated"} | faction=${entry.faction ?? "none stated"} | race=${entry.raceNotes ?? "none stated"} | profession=${entry.professionRequirements?.join(", ") ?? "none"} | notes=${entry.notes ?? "none"} | verification=${entry.provenance.verificationStatus} | provenanceId=${entry.provenanceId ?? "missing"} | review=${reviewStatus(entry, flags)}`);
    for (const flag of flags) console.log(`   FLAG: ${flag}`);
  }
}
console.log("\n## AUTOMATED REVIEW FLAGS");
const flagged = rows.filter(({ entry }) => flagsFor(entry).length);
for (const { slot, rank, entry } of flagged) console.log(`${slot} rank ${rank}: ${nameFor(entry)} (#${entry.itemId}) — ${flagsFor(entry).join(" ")}`);
console.log(`\nTotal rows reviewed: ${rows.length}`);
console.log(`Clean rows: ${rows.length - flagged.length}`);
console.log(`Review required: ${flagged.length}`);
console.log(`Disputed: ${rows.filter(({ entry }) => entry.provenance.verificationStatus === "disputed").length}`);
console.log(`Missing source: ${rows.filter(({ entry }) => !entry.source?.type).length}`);
console.log(`Missing metadata: ${rows.filter(({ entry }) => !metadata.has(entry.itemId)).length}`);
console.log(`Missing provenance: ${rows.filter(({ entry }) => !entry.provenanceId || !entry.provenance.source || !entry.provenance.reviewedAt || !entry.provenance.reviewedBy).length}`);
console.log(`Slots complete: ${referenceSlots.every((slot) => (set.slots[slot]?.length ?? 0) > 0) ? "YES" : "NO"}`);
const publish = publishReport(set);
console.log(`Publishable: ${publish.publishable ? "YES" : "NO"}`);
console.log("\n## HUMAN REVIEW NOTES");
console.log("The local curated provenance confirms authorship and review status, but does not independently prove every boss, quest, vendor, drop-rate, or tier conclusion. Flagged rows require human content review before publication.");
console.log("No ranking, tier, source, or set status was changed by this report.");

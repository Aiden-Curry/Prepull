import { referenceSlots } from "./data.ts";
import type { ReferenceGearSet } from "./types.ts";
import { validateReferenceSets, type CuratedDataIssue } from "./validate.ts";

export type PublishReport = { setId: string; status: string; publishable: boolean; missingSlots: string[]; unreviewed: number; missingProvenance: number; issues: CuratedDataIssue[] };
export function publishReport(set: ReferenceGearSet): PublishReport {
  const missingSlots = referenceSlots.filter((slot) => !(set.slots[slot]?.length));
  const entries = Object.values(set.slots).flatMap((items) => items ?? []);
  const unreviewed = entries.filter((entry) => ["unreviewed", "incomplete", "disputed"].includes(entry.provenance.verificationStatus)).length;
  const missingProvenance = entries.filter((entry) => !entry.provenance.source || !entry.provenance.reviewedAt || !entry.provenance.reviewedBy).length;
  const issues = validateReferenceSets({ id: "publish-check", className: set.className, specialization: set.specialization, contentVersion: set.contentVersion, role: set.role, strategy: "curated-reference", contexts: [set.context], defaultSetId: set.id, methodology: set.methodology, sets: [set] });
  const publishable = (set.status === "reviewed" || set.status === "published") && missingSlots.length === 0 && unreviewed === 0 && missingProvenance === 0 && !issues.some((issue) => issue.severity === "error");
  return { setId: set.id, status: set.status ?? (set.complete ? "reviewed" : "incomplete"), publishable, missingSlots, unreviewed, missingProvenance, issues };
}

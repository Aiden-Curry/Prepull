import type { CuratedReferenceProfile, ReferenceContext } from "./types.ts";
import { validContexts, validPhases, validSlots, validSourceTypes, validTiers, provenanceRegistry, type AuthoringRow } from "./authoring.ts";
import { normalizedItemMetadata } from "../item-metadata/store.ts";
import { metadataSlotCompatible } from "../item-metadata/validate.ts";
import type { NormalizedItemMetadata } from "../item-metadata/types.ts";

export type AuthoringIssue = { severity: "error" | "warning"; row: number; code: string; message: string };
const builtInProfiles = new Set(["warrior:fury", "warrior:protection", "priest:holy", "mage:frost"]);
const verificationStates = new Set(["unreviewed", "reviewed", "verified", "curated", "incomplete", "disputed"]);

export function validateAuthoringRows(rows: AuthoringRow[], profileList: CuratedReferenceProfile[] = [], metadata: Map<number, NormalizedItemMetadata> = normalizedItemMetadata()): AuthoringIssue[] {
  const issues: AuthoringIssue[] = [];
  const profiles = new Set([...builtInProfiles, ...profileList.map((profile) => `${profile.className.toLowerCase()}:${profile.specialization.toLowerCase()}`)]);
  const seen = new Set<string>();
  const ranks = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const required = ["contentVersion", "class", "spec", "role", "phase", "context", "setId", "slot", "itemId", "tier", "rank", "sourceType", "sourceName", "activity", "provenanceId", "verificationStatus"] as const;
    for (const field of required) if (!row[field]?.trim()) issues.push({ severity: "error", row: rowNumber, code: "missing-required", message: `Missing ${field}.` });
    const profileKey = `${row.class.toLowerCase()}:${row.spec.toLowerCase()}`;
    if (!profiles.has(profileKey)) issues.push({ severity: "error", row: rowNumber, code: "invalid-profile", message: `Unsupported class/spec ${profileKey}.` });
    if (row.contentVersion !== "era" && row.contentVersion !== "tbc") issues.push({ severity: "error", row: rowNumber, code: "invalid-content-version", message: `Unknown content version ${row.contentVersion}.` });
    if (!validPhases.has(row.phase)) issues.push({ severity: "error", row: rowNumber, code: "invalid-phase", message: `Unknown phase ${row.phase}.` });
    if (!validContexts.has(row.context as ReferenceContext)) issues.push({ severity: "error", row: rowNumber, code: "invalid-context", message: `Unknown context ${row.context}.` });
    if (!validSlots.has(row.slot as never)) issues.push({ severity: "error", row: rowNumber, code: "invalid-slot", message: `Unknown slot ${row.slot}.` });
    const itemId = Number(row.itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) issues.push({ severity: "error", row: rowNumber, code: "invalid-item-id", message: `Malformed item ID ${row.itemId}.` });
    else { const item = metadata.get(itemId); if (!item) issues.push({ severity: "warning", row: rowNumber, code: "missing-item-metadata", message: `Item #${itemId} is not in normalized metadata.` }); else { if (!metadataSlotCompatible(item, row.slot as never)) issues.push({ severity: "error", row: rowNumber, code: "slot-mismatch", message: `Item #${itemId} metadata slot ${item.slot} is incompatible with curated slot ${row.slot}.` }); const requestedClass = row.class.charAt(0).toUpperCase() + row.class.slice(1).toLowerCase(); if (item.classRestrictions && !item.classRestrictions.includes(requestedClass)) issues.push({ severity: "error", row: rowNumber, code: "class-restriction", message: `Item #${itemId} is restricted to ${item.classRestrictions.join(", ")}.` }); } }
    if (!validTiers.has(row.tier as never)) issues.push({ severity: "error", row: rowNumber, code: "invalid-tier", message: `Unknown tier ${row.tier}.` });
    if (row.rank && (!Number.isInteger(Number(row.rank)) || Number(row.rank) < 1)) issues.push({ severity: "error", row: rowNumber, code: "invalid-rank", message: "Rank must be a positive integer." });
    if (!validSourceTypes.has(row.sourceType)) issues.push({ severity: "error", row: rowNumber, code: "invalid-source-type", message: `Unknown source type ${row.sourceType}.` });
    if (row.phase === "pre-raid" && row.sourceType === "raid") issues.push({ severity: "error", row: rowNumber, code: "raid-dependent-pre-raid-item", message: "Raid-dependent items cannot be authored into the mature Era Pre-Raid set." });
    if (!provenanceRegistry[row.provenanceId]) issues.push({ severity: "error", row: rowNumber, code: "unknown-provenance", message: `Unknown provenance ID ${row.provenanceId}.` });
    if (!verificationStates.has(row.verificationStatus)) issues.push({ severity: "error", row: rowNumber, code: "invalid-verification", message: `Unknown verification state ${row.verificationStatus}.` });
    const exact = `${row.contentVersion}:${profileKey}:${row.phase}:${row.context}:${row.setId}:${row.slot}:${row.itemId}:${row.tier}`;
    if (seen.has(exact)) issues.push({ severity: "error", row: rowNumber, code: "duplicate-row", message: "Exact recommendation row is duplicated." });
    seen.add(exact);
    if (row.rank) { const rankKey = `${row.contentVersion}:${profileKey}:${row.phase}:${row.context}:${row.setId}:${row.slot}:${row.tier}:${row.rank}`; if (ranks.has(rankKey)) issues.push({ severity: "error", row: rowNumber, code: "duplicate-rank", message: `Rank ${row.rank} is duplicated within ${row.tier}.` }); ranks.add(rankKey); }
  }
  for (const profile of profileList) for (const row of rows.filter((candidate) => candidate.class.toLowerCase() === profile.className.toLowerCase() && candidate.spec.toLowerCase() === profile.specialization.toLowerCase())) if (!profile.contexts.includes(row.context as ReferenceContext)) issues.push({ severity: "error", row: rows.indexOf(row) + 2, code: "unsupported-context", message: `${row.context} is not supported by ${profile.className} ${profile.specialization}.` });
  return issues;
}

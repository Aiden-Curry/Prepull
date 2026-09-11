import fs from "node:fs";
import { parseAuthoringCsv } from "../curated-gear/authoring.ts";
import { validateAuthoringRows } from "../curated-gear/authoring-validate.ts";
import { publishReport } from "../curated-gear/publish.ts";
import { validateReferenceSets } from "../curated-gear/validate.ts";
import { validateCandidateDataset } from "../gear-analysis/validate-dataset.ts";
import { normalizedItemMetadata } from "../item-metadata/store.ts";
import { loadRecommendationProfile, recommendationRegistry, validateRecommendationRegistry } from "./registry.ts";
import { parseSpecManifest, type SpecAuthoringManifest } from "./manifest.ts";
import { buildSpecSnapshot, sha256 } from "./snapshot.ts";

export type SpecValidationIssue = { severity: "blocker" | "warning"; code: string; message: string };
const blocker = (code: string, message: string): SpecValidationIssue => ({ severity: "blocker", code, message });
const warning = (code: string, message: string): SpecValidationIssue => ({ severity: "warning", code, message });
const sourceTypes: Record<string, string> = { dungeon: "Dungeon", raid: "Raid", quest: "Quest", crafted: "Profession", profession: "Profession", reputation: "Reputation", vendor: "Vendor", "world-drop": "World Drop", pvp: "PvP" };

export function validateSpec(manifest: SpecAuthoringManifest): SpecValidationIssue[] {
  const issues: SpecValidationIssue[] = [];
  for (const message of parseSpecManifest(manifest).issues) issues.push(blocker("manifest", message));
  const registration = recommendationRegistry.find((entry) => entry.key === manifest.key);
  if (!registration || registration.manifest !== manifest) issues.push(blocker("registration", `${manifest.key} is not connected to the central registry.`));
  for (const message of validateRecommendationRegistry(registration ? [registration] : [])) issues.push(blocker("registry", message));
  if (!fs.existsSync(manifest.documentationPath) || !fs.readFileSync(manifest.documentationPath, "utf8").trim()) issues.push(blocker("documentation", `Missing provenance documentation: ${manifest.documentationPath}.`));
  const profiles = recommendationRegistry.map((entry) => entry.profile);
  const candidateIds = new Set(manifest.candidates.map((candidate) => candidate.itemId));
  const metadataIds = new Set(normalizedItemMetadata().keys());
  const authoredIds = new Set<number>();
  for (const phase of manifest.phases) {
    if (!fs.existsSync(phase.authoringFile)) { issues.push(blocker("dataset", `Missing authored dataset: ${phase.authoringFile}.`)); continue; }
    const parsed = parseAuthoringCsv(fs.readFileSync(phase.authoringFile, "utf8"));
    for (const message of parsed.errors) issues.push(blocker("csv", `${phase.authoringFile}: ${message}`));
    for (const issue of validateAuthoringRows(parsed.rows, profiles)) issues.push((issue.severity === "error" ? blocker : warning)(`authoring:${issue.code}`, `${phase.authoringFile}:${issue.row}: ${issue.message}`));
    for (const row of parsed.rows) {
      const id = Number(row.itemId); authoredIds.add(id);
      if (row.setId !== phase.setId || (phase.phase === 0 ? row.phase !== "pre-raid" : row.phase !== `phase-${phase.phase}`)) issues.push(blocker("phase-metadata", `${phase.authoringFile} contains a row outside ${phase.setId}.`));
      if (!candidateIds.has(id) && !metadataIds.has(id)) issues.push(blocker("candidate-coverage", `Authored item #${id} has neither a registered candidate nor normalized item metadata in ${manifest.key}.`));
      else if (!candidateIds.has(id)) issues.push(warning("legacy-metadata-fallback", `Authored item #${id} uses the accepted normalized metadata fallback.`));
      const candidate = manifest.candidates.find((item) => item.itemId === id);
      if (candidate) {
        const candidateSource = candidate.source?.instance ?? candidate.source?.zone ?? candidate.source?.profession ?? "";
        if (manifest.strictCandidateMetadata && candidate.slot !== row.slot && !candidate.slotOptions?.includes(row.slot as never)) issues.push(blocker("slot-metadata", `Authored item #${id} uses ${row.slot} but its candidate uses ${candidate.slot}.`));
        if (manifest.strictCandidateMetadata && (sourceTypes[row.sourceType] !== candidate.source?.type || candidateSource !== row.sourceName || (candidate.source?.boss ?? "") !== row.boss)) issues.push(blocker("source-metadata", `Authored source for #${id} does not match its reviewed candidate metadata.`));
        if (typeof candidate.isRealistic !== "boolean") issues.push(blocker("acquisition-classification", `Candidate #${id} has no explicit realistic/aspirational classification.`));
      }
    }
    try {
      const first = buildSpecSnapshot(manifest, phase); const second = buildSpecSnapshot(manifest, phase);
      if (first.serialized !== second.serialized) issues.push(blocker("snapshot-determinism", `${phase.datasetVersion} is not deterministic.`));
      if (!fs.existsSync(phase.snapshotFile)) issues.push(blocker("snapshot-missing", `Missing published snapshot: ${phase.snapshotFile}.`));
      else {
        const snapshotBytes = fs.readFileSync(phase.snapshotFile); const actual = sha256(snapshotBytes);
        if (!phase.acceptedSnapshotSha256) issues.push(blocker("snapshot-unaccepted", `${phase.datasetVersion} has no reviewed snapshot hash in its manifest.`));
        else if (actual !== phase.acceptedSnapshotSha256) issues.push(blocker("snapshot-integrity", `${phase.datasetVersion} expected ${phase.acceptedSnapshotSha256} but found ${actual}.`));
        try {
          const published = JSON.parse(snapshotBytes.toString("utf8"));
          if (published.schemaVersion === 1 && snapshotBytes.toString("utf8") !== first.serialized) issues.push(blocker("snapshot-source-drift", `${phase.datasetVersion} no longer matches its authored source data.`));
          if (published.canonicalSourceSha256 && published.canonicalSourceSha256 !== first.sourceHashes[0]?.sha256) issues.push(blocker("snapshot-source-drift", `${phase.datasetVersion} canonical source hash has drifted.`));
          if (published.source?.baseCsvSha256 && published.source.baseCsvSha256 !== first.sourceHashes[0]?.sha256) issues.push(blocker("snapshot-source-drift", `${phase.datasetVersion} base source hash has drifted.`));
          if (published.source?.overlayCsvSha256 && published.source.overlayCsvSha256 !== first.sourceHashes.at(-1)?.sha256) issues.push(blocker("snapshot-source-drift", `${phase.datasetVersion} overlay source hash has drifted.`));
        } catch { issues.push(blocker("snapshot-json", `${phase.snapshotFile} is not valid JSON.`)); }
      }
    } catch (error) { issues.push(blocker("snapshot-generation", error instanceof Error ? error.message : String(error))); }
  }
  for (const candidate of manifest.candidates) if (!authoredIds.has(candidate.itemId)) issues.push(warning("unreferenced-candidate", `Candidate #${candidate.itemId} is not referenced by an authored phase.`));
  for (const issue of validateCandidateDataset(manifest.candidates, { contentVersion: manifest.contentVersion, className: manifest.className })) issues.push((issue.severity === "error" ? blocker : warning)(`candidate:${issue.code}`, `${issue.itemId ? `#${issue.itemId}: ` : ""}${issue.message}`));
  try {
    const profile = loadRecommendationProfile(registration!);
    for (const issue of validateReferenceSets(profile)) {
      // Legacy profile shells declare `complete: false` even when their published,
      // normalized sets are complete. Publishability and slot coverage below are
      // the authoritative structural checks, so do not report that stale flag.
      if (!manifest.strictCandidateMetadata && issue.code === "incomplete-set") continue;
      issues.push((issue.severity === "error" ? blocker : warning)(`reference:${issue.code}`, `${issue.setId}: ${issue.message}`));
    }
    for (const phase of manifest.phases) {
      const set = profile.sets.find((entry) => entry.id === phase.setId);
      if (!set) continue;
      const report = publishReport(set);
      if (!report.publishable) issues.push(blocker("publishability", `${phase.datasetVersion} is not publishable.`));
      for (const paired of [["Finger 1", "Finger 2"], ["Trinket 1", "Trinket 2"]] as const) if (paired.some((slot) => !(set.slots[slot]?.length))) issues.push(blocker("paired-slot", `${phase.datasetVersion} does not cover both ${paired.join(" and ")}.`));
    }
  } catch (error) { issues.push(blocker("profile-load", error instanceof Error ? error.message : String(error))); }
  for (const message of manifest.ruleModule?.validate(manifest.candidates) ?? []) issues.push(blocker(`rule:${manifest.ruleModule?.id}`, message));
  return issues;
}

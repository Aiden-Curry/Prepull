import fs from "node:fs";
import { validateReferenceSets } from "../lib/curated-gear/validate.ts";
import { publishReport } from "../lib/curated-gear/publish.ts";
import { parseAuthoringCsv } from "../lib/curated-gear/authoring.ts";
import { validateAuthoringRows } from "../lib/curated-gear/authoring-validate.ts";
import { loadRecommendationProfile, recommendationRegistry, validateRecommendationRegistry } from "../lib/recommendations/registry.ts";

const registryIssues = validateRecommendationRegistry();
for (const issue of registryIssues) console.log(`ERROR [registry] ${issue}`);
if (registryIssues.length) process.exitCode = 1;
const profiles = recommendationRegistry.map(loadRecommendationProfile);
for (const profile of profiles) {
  const issues = validateReferenceSets(profile);
  for (const issue of issues) console.log(`${issue.severity.toUpperCase()} [${issue.code}] ${issue.setId}: ${issue.message}`);
  const errors = issues.filter((issue) => issue.severity === "error");
  console.log(`${profile.className} ${profile.specialization} curated validation: ${errors.length ? "FAIL" : "PASS"} (${issues.length} issue${issues.length === 1 ? "" : "s"})`);
  for (const set of profile.sets) { const report = publishReport(set); const rows = Object.values(set.slots).reduce((count, entries) => count + (entries?.length ?? 0), 0); console.log(`${set.name}: Slots complete: ${report.missingSlots.length === 0 ? "YES" : "NO"}; Rows: ${rows}; Missing slots: ${report.missingSlots.length ? report.missingSlots.join(", ") : "none"}; Unreviewed: ${report.unreviewed}; Missing provenance: ${report.missingProvenance}; Set status: ${report.status}; Publishable: ${report.publishable ? "YES" : "NO"}`); }
  if (errors.length) process.exitCode = 1;
}
const authoringFile = process.argv.find((entry) => entry.startsWith("--file="))?.slice(7) ?? "data/curated/era/warrior/fury/reference.csv";
if (fs.existsSync(authoringFile)) { const parsed = parseAuthoringCsv(fs.readFileSync(authoringFile, "utf8")); const authoringIssues = [...parsed.errors.map((message) => ({ severity: "error", row: 0, code: "csv", message } as const)), ...validateAuthoringRows(parsed.rows, profiles)]; for (const issue of authoringIssues) console.log(`${issue.severity.toUpperCase()} [authoring:${issue.code}] row ${issue.row}: ${issue.message}`); if (authoringIssues.some((issue) => issue.severity === "error")) process.exitCode = 1; else console.log(`Authoring CSV validation: PASS (${parsed.rows.length} rows)`); }

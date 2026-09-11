import { validateCandidateDataset } from "../lib/gear-analysis/validate-dataset.ts";
import { recommendationRegistry, validateRecommendationRegistry } from "../lib/recommendations/registry.ts";

const registryIssues = validateRecommendationRegistry();
for (const issue of registryIssues) console.log(`ERROR registry: ${issue}`);
for (const registration of recommendationRegistry) {
  const issues = validateCandidateDataset(registration.candidates, { contentVersion: registration.contentVersion, className: registration.className });
  console.log(`Validated ${registration.candidates.length} ${registration.contentVersion} ${registration.className} ${registration.specName} candidates.`);
  for (const issue of issues) console.log(`${issue.severity.toUpperCase()} ${registration.key}:${issue.code}${issue.itemId ? ` [${issue.itemId}]` : ""}: ${issue.message}`);
  if (issues.some((issue) => issue.severity === "error")) process.exitCode = 1;
}
if (registryIssues.length) process.exitCode = 1;

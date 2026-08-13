import { eraFuryCandidates } from "../lib/gear-analysis/dataset.ts";
import { validateFuryDataset } from "../lib/gear-analysis/validate-dataset.ts";

const issues = validateFuryDataset(eraFuryCandidates);
console.log(`Validated ${eraFuryCandidates.length} Era Fury candidates.`);
for (const issue of issues) console.log(`${issue.severity.toUpperCase()} ${issue.code}${issue.itemId ? ` [${issue.itemId}]` : ""}: ${issue.message}`);
if (issues.some((issue) => issue.severity === "error")) process.exitCode = 1;

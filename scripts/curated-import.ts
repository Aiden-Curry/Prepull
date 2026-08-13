import fs from "node:fs";
import { parseAuthoringCsv, rowsToSets } from "../lib/curated-gear/authoring.ts";
import { validateAuthoringRows } from "../lib/curated-gear/authoring-validate.ts";
import { curatedReferenceProfiles } from "../lib/curated-gear/data.ts";
import { arg, hasArg, writeJson } from "./curated-common.ts";

const file = arg("file");
if (!file) { console.error("Usage: npm run curated:import -- --file=<path> [--dry-run]"); process.exit(1); }
const parsed = parseAuthoringCsv(fs.readFileSync(file, "utf8"));
const issues = [...parsed.errors.map((message) => ({ severity: "error", row: 0, code: "csv", message } as const)), ...validateAuthoringRows(parsed.rows, curatedReferenceProfiles)];
const built = rowsToSets(parsed.rows, curatedReferenceProfiles);
issues.push(...built.errors.map((message) => ({ severity: "error" as const, row: 0, code: "normalization", message })));
for (const issue of issues) console.log(`${issue.severity.toUpperCase()} row ${issue.row}: [${issue.code}] ${issue.message}`);
const errors = issues.filter((issue) => issue.severity === "error");
console.log(`Import validation: ${errors.length ? "FAIL" : "PASS"} (${parsed.rows.length} row${parsed.rows.length === 1 ? "" : "s"})`);
if (errors.length) process.exit(1);
if (hasArg("dry-run")) { console.log("Dry run: no generated data was changed."); process.exit(0); }
const output = arg("output") ?? "data/curated/generated/imported-reference.json";
writeJson(output, built.sets);
console.log(`Generated normalized reference data: ${output}`);

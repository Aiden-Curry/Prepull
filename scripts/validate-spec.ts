import { recommendationSpecManifests } from "../lib/recommendations/manifests/index.ts";
import { validateSpec } from "../lib/recommendations/validate-spec.ts";

const requested = process.argv[2];
const manifests = !requested || requested === "all" ? recommendationSpecManifests : recommendationSpecManifests.filter((manifest) => manifest.key === requested);
if (!manifests.length) { console.error(`Unknown recommendation spec: ${requested}.`); process.exit(1); }
let failed = false;
for (const manifest of manifests) {
  const issues = validateSpec(manifest);
  const blockers = issues.filter((issue) => issue.severity === "blocker");
  for (const issue of blockers) console.log(`BLOCKER [${issue.code}] ${issue.message}`);
  const warningCounts = new Map<string, number>();
  for (const issue of issues.filter((entry) => entry.severity === "warning")) warningCounts.set(issue.code, (warningCounts.get(issue.code) ?? 0) + 1);
  for (const [code, count] of warningCounts) console.log(`WARNING [${code}] ${count} occurrence${count === 1 ? "" : "s"}.`);
  console.log(`${manifest.key.padEnd(30)} ${blockers.length ? "FAIL" : "PASS"} (${blockers.length} blocker${blockers.length === 1 ? "" : "s"}, ${issues.length - blockers.length} warning${issues.length - blockers.length === 1 ? "" : "s"})`);
  failed ||= blockers.length > 0;
}
if (failed) process.exitCode = 1;

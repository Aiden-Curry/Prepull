import fs from "node:fs";
import path from "node:path";
import { recommendationSpecManifests } from "../lib/recommendations/manifests/index.ts";
import { buildSpecSnapshot } from "../lib/recommendations/snapshot.ts";

const requested = process.argv[2];
const manifest = recommendationSpecManifests.find((entry) => entry.key === requested);
if (!manifest) { console.error(`Usage: npm run snapshot:spec -- <spec-key> [--write] [--replace-published=<dataset-version>]`); process.exit(1); }
const write = process.argv.includes("--write");
const reviewedReplacements = new Set(process.argv.filter((entry) => entry.startsWith("--replace-published=")).map((entry) => entry.split("=")[1]));
for (const phase of manifest.phases) {
  const output = buildSpecSnapshot(manifest, phase);
  console.log(`${phase.datasetVersion}: ${output.sha256}`);
  for (const source of output.sourceHashes) console.log(`  source ${source.path}: ${source.sha256}`);
  if (!write) continue;
  if (fs.existsSync(phase.snapshotFile) && !reviewedReplacements.has(phase.datasetVersion)) throw new Error(`${phase.snapshotFile} already exists. Pass --replace-published=${phase.datasetVersion} only after explicit review.`);
  fs.mkdirSync(path.dirname(phase.snapshotFile), { recursive: true });
  fs.writeFileSync(phase.snapshotFile, output.serialized, "utf8");
  console.log(`  wrote ${phase.snapshotFile}`);
}

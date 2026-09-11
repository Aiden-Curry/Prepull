import crypto from "node:crypto";
import fs from "node:fs";
import type { SpecAuthoringManifest, SpecPhaseManifest } from "./manifest.ts";
import { loadRecommendationProfile } from "./registry.ts";

export const sha256 = (value: string | Buffer) => crypto.createHash("sha256").update(value).digest("hex").toUpperCase();
export const sourceSha256 = (file: string) => sha256(fs.readFileSync(file));

export function buildSpecSnapshot(manifest: SpecAuthoringManifest, phase: SpecPhaseManifest) {
  const profile = loadRecommendationProfile({
    key: manifest.key as never, contentVersion: manifest.contentVersion, className: manifest.className, specName: manifest.specName,
    availablePhases: manifest.phases.map((entry) => entry.phase), setIdByPhase: Object.fromEntries(manifest.phases.map((entry) => [entry.phase, entry.setId])),
    profile: manifest.profile, candidates: manifest.candidates, decorateEntry: manifest.decorateEntry, ruleModule: manifest.ruleModule,
    includeSingleBestInSlotTargets: manifest.includeSingleBestInSlotTargets, manifest,
  });
  const set = profile.sets.find((entry) => entry.id === phase.setId);
  if (!set) throw new Error(`${manifest.key} cannot build missing set ${phase.setId}.`);
  const entries = Object.values(set.slots).flatMap((items) => items ?? []);
  const sourcePhases = manifest.phases.filter((entry) => entry.phase === 0 || entry.phase === phase.phase);
  const document = {
    schemaVersion: 1,
    specKey: manifest.key,
    datasetVersion: phase.datasetVersion,
    identity: { contentVersion: manifest.contentVersion, className: manifest.className, specName: manifest.specName, level: manifest.level, role: manifest.role },
    phase: { number: phase.phase, label: phase.label, setId: phase.setId, baseSetId: phase.phase > 0 ? manifest.phases[0].setId : undefined },
    sourceDatasets: sourcePhases.map((entry) => ({ phase: entry.phase, path: entry.authoringFile.replaceAll("\\", "/"), sha256: sourceSha256(entry.authoringFile) })),
    content: { rows: entries.length, uniqueItems: new Set(entries.map((entry) => entry.itemId)).size, slots: Object.values(set.slots).filter((items) => (items?.length ?? 0) > 0).length },
    provenance: { id: manifest.provenance.id, documentationPath: manifest.documentationPath.replaceAll("\\", "/") },
    capabilities: manifest.capabilities,
  };
  const serialized = `${JSON.stringify(document, null, 2)}\n`;
  return { document, serialized, sha256: sha256(serialized), sourceHashes: document.sourceDatasets.map((entry) => ({ path: entry.path, sha256: entry.sha256 })) };
}

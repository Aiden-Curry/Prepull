import fs from "node:fs";
import path from "node:path";
import { eraFuryCandidates } from "../gear-analysis/dataset.ts";
import type { NormalizedItemMetadata } from "./types.ts";

export const metadataStorePath = path.resolve("data/items/metadata.json");
const manualRecords = (): NormalizedItemMetadata[] => eraFuryCandidates.map((item) => ({ ...item, provenance: { source: "manual-dataset", verifiedAt: "2026-08-12", contentVersion: "era", realmType: "era" } }));
export function readCachedItemMetadata(): NormalizedItemMetadata[] { if (!fs.existsSync(metadataStorePath)) return []; try { const parsed = JSON.parse(fs.readFileSync(metadataStorePath, "utf8")) as NormalizedItemMetadata[]; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
export function normalizedItemMetadata(): Map<number, NormalizedItemMetadata> { const result = new Map<number, NormalizedItemMetadata>(); for (const item of [...manualRecords(), ...readCachedItemMetadata()]) result.set(item.itemId, item); return result; }
export function writeCachedItemMetadata(records: NormalizedItemMetadata[]) { fs.mkdirSync(path.dirname(metadataStorePath), { recursive: true }); fs.writeFileSync(metadataStorePath, `${JSON.stringify(records, null, 2)}\n`, "utf8"); }

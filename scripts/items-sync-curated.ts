import { parseAuthoringCsv } from "../lib/curated-gear/authoring.ts";
import type { Region } from "../lib/types.ts";
import { syncCuratedMetadata } from "../lib/item-metadata/sync.ts";
import { arg, hasArg } from "./curated-common.ts";
import fs from "node:fs";
import { loadProjectEnv } from "../lib/config/env.ts";

const environment = loadProjectEnv();
const file = arg("file") ?? "data/curated/era/warrior/fury/reference.csv";
const parsed = parseAuthoringCsv(fs.readFileSync(file, "utf8"));
if (parsed.errors.length) { for (const error of parsed.errors) console.error(`ERROR: ${error}`); process.exit(1); }
const requested = arg("item");
const csvIds = parsed.rows.filter((row) => (!arg("class") || row.class.toLowerCase() === arg("class")!.toLowerCase()) && (!arg("spec") || row.spec.toLowerCase() === arg("spec")!.toLowerCase()) && (!arg("phase") || row.phase === arg("phase"))).map((row) => Number(row.itemId)).filter((id) => Number.isInteger(id));
const ids = [...new Set([...csvIds, ...(requested ? [Number(requested)] : [])])].filter((id) => !requested || id === Number(requested));
const canFetch = Boolean(process.env.BATTLENET_CLIENT_ID && process.env.BATTLENET_CLIENT_SECRET);
const provider = canFetch ? new (await import("../lib/blizzard/item-data-provider.ts")).BlizzardItemDataProvider() : undefined;
const region = (arg("region") ?? "eu") as Region;
const result = await syncCuratedMetadata(ids, provider ? async (itemId) => { const diagnostic = await provider.getItemDiagnostic(region, "era", "era", itemId); if (itemId === Number(requested)) console.log(`Item diagnostic: id=${itemId} oauth=${diagnostic.oauthSucceeded ? "yes" : "no"} status=${diagnostic.status ?? "n/a"} namespace=${diagnostic.namespace} normalization=${diagnostic.item ? "success" : "not-resolved"}`); return { item: diagnostic.item ?? null, reason: diagnostic.reason }; } : undefined, !hasArg("dry-run"));
console.log(`Environment loaded: ${environment.loaded ? "yes" : "no"}`);
console.log(`BATTLENET_CLIENT_ID present: ${environment.clientIdPresent ? "yes" : "no"}`);
console.log(`BATTLENET_CLIENT_SECRET present: ${environment.clientSecretPresent ? "yes" : "no"}`);
console.log(`Selected provider: ${provider ? "Blizzard Battle.net" : "unavailable (credentials missing)"}`);
console.log(`Selected region: ${region}`);
console.log("Selected namespace: static-classic1x-" + region);
if (requested && !provider) console.log(`Item diagnostic: id=${requested} oauth=no status=n/a namespace=static-classic1x-${region} normalization=not-resolved`);
console.log(`Curated unique items: ${result.uniqueIds}`);
console.log(`Already known: ${result.alreadyKnown}`);
console.log(`Fetched successfully: ${result.fetched}`);
for (const itemId of result.unresolved) console.log(`UNRESOLVED ITEM #${itemId} — ${result.unresolvedReasons[itemId]}`);
console.log(`Unresolved: ${result.unresolved.length}`);
const reasons = Object.entries(result.unresolvedReasons).reduce<Record<string, number>>((summary, [, reason]) => { summary[reason] = (summary[reason] ?? 0) + 1; return summary; }, {});
if (Object.keys(reasons).length) { console.log("Reasons:"); for (const [reason, count] of Object.entries(reasons)) console.log(`* ${reason}: ${count}`); }
for (const conflict of result.conflicts) console.log(`NAME CONFLICT #${conflict.itemId}: existing "${conflict.existingName}" vs resolved "${conflict.resolvedName}"`);
for (const error of result.validationErrors) console.log(`ERROR ${error}`);
if (hasArg("dry-run")) console.log("Dry run: metadata cache was not changed.");
if (result.conflicts.length || result.validationErrors.length) process.exitCode = 1;

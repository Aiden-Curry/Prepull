import { readFileSync } from "node:fs";

const source = ["lib/guilds/actions.ts", "lib/guilds/readiness-actions.ts"].map((file) => readFileSync(file, "utf8")).join("\n");
const inventory = JSON.parse(readFileSync("data/acceptance/guild-action-inventory.json", "utf8")) as { actions: Array<{ name: string; authorization: string; ids: string[] }> };
const exported = [...source.matchAll(/export async function (\w+)\s*\(/g)].map((match) => match[1]);
const listed = inventory.actions.map((action) => action.name);
const missing = exported.filter((name) => !listed.includes(name));
const stale = listed.filter((name) => !exported.includes(name));
const incomplete = inventory.actions.filter((action) => !action.authorization || !Array.isArray(action.ids));
if (missing.length || stale.length || incomplete.length) {
  console.error(JSON.stringify({ missing, stale, incomplete: incomplete.map((action) => action.name) }, null, 2));
  process.exit(1);
}
console.log(`Guild action inventory valid: ${listed.length} exported actions documented.`);

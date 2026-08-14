import { readFileSync } from "node:fs";

const inventory = JSON.parse(readFileSync("data/acceptance/guild-action-inventory.json", "utf8")) as { actions: Array<{ name: string }> };
const report = JSON.parse(readFileSync("artifacts/acceptance/guild-action-coverage.json", "utf8")) as { discoveredActionCount: number; inventoriedActionCount: number; directlyInvokedActionCount: number; uncoveredActions: string[] };
const expected = inventory.actions.length;
const errors = [
  report.discoveredActionCount !== expected ? `discovered=${report.discoveredActionCount}, expected=${expected}` : "",
  report.inventoriedActionCount !== expected ? `inventoried=${report.inventoriedActionCount}, expected=${expected}` : "",
  report.directlyInvokedActionCount !== expected ? `direct=${report.directlyInvokedActionCount}, expected=${expected}` : "",
  report.uncoveredActions.length ? `uncovered=${report.uncoveredActions.join(",")}` : "",
].filter(Boolean);
if (errors.length) { console.error(`Guild action coverage invalid: ${errors.join("; ")}`); process.exit(1); }
console.log(`Guild action coverage valid: ${expected}/${expected} actions directly invoked.`);

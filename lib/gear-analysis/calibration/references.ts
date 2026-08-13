import type { CalibrationReference } from "./types.ts";
import { furyCalibrationFixtures } from "./fixtures.ts";

// Add manually obtained, reproducible reference results here by case ID.
// Never paste secrets or simulator credentials into this file. Pending cases
// remain pending and are excluded from agreement metrics.
export const manualFuryReferences: Record<string, CalibrationReference> = {
  "dps-chest-vs-tier-chest": {
    status: "entered",
    source: "simulation",
    tool: "Guybrush Warrior Sim",
    toolVersion: "Classic",
    capturedAt: "2026-08-12",
    enteredAt: "2026-08-12",
    reviewer: "Aiden",
    loadoutADps: 384.37,
    loadoutBDps: 399.59,
    iterations: 50000,
    preference: "itemB",
    difference: 15.22,
    notes: "Manually entered Guybrush Warrior Sim — Classic result; comparable conditions confirmed.",
    scenario: furyCalibrationFixtures.find((fixture) => fixture.name === "strength-crit")!.scenario,
  },
};

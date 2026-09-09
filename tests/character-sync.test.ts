import assert from "node:assert/strict";
import test from "node:test";
import { diffEquipment } from "../lib/characters/sync-service.ts";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";

const sync = (equipment: any[]) => ({ id: "sync", userCharacterId: "character", syncedAt: new Date().toISOString(), status: "success" as const, level: 60, className: "Warrior", spec: "Fury", race: "Orc", faction: "Horde" as const, professions: [], talents: [], contentVersion: "era" as const, characterRealmType: "era" as const, provider: "mock", equipment });
test("first sync establishes a baseline without false gear changes", () => { const result = diffEquipment(undefined, sync(eraFuryFixtures.fresh60.equipment)); assert.equal(result.firstSync, true); assert.equal(result.changedCount, 0); });
test("equipment diff detects replacement and added slots", () => { const before = [{ ...eraFuryFixtures.fresh60.equipment[0], itemId: 1, name: "Old" }]; const after = [{ ...before[0], itemId: 2, name: "New" }, { ...eraFuryFixtures.fresh60.equipment[1], itemId: 3 }]; const result = diffEquipment(sync(before), sync(after)); assert.equal(result.changes.find((change) => change.slot === before[0].slot)?.kind, "replaced"); assert.equal(result.changes.find((change) => change.slot === after[1].slot)?.kind, "added"); });
test("unchanged item IDs are not reported as progress", () => { const items = eraFuryFixtures.fresh60.equipment.slice(0, 2); const result = diffEquipment(sync(items), sync(items.map((item) => ({ ...item })))); assert.equal(result.changedCount, 0); });

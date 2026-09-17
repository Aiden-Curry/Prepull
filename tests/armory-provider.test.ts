import assert from "node:assert/strict";
import test from "node:test";
import { BattleNetCharacterProvider } from "../lib/blizzard/character-provider.ts";
import { characterCache } from "../lib/server/cache.ts";
const lookup = { contentVersion: "era" as const, realmType: "era" as const, region: "eu" as const, realm: "firemaw", characterName: "example" };
test("optional endpoint failures preserve core sync, public equipment failure is isolated, and requests are bounded", async () => {
  const previousFetch = globalThis.fetch; const env = { ...process.env }; let calls = 0, failEquipment = false;
  process.env.BATTLENET_CLIENT_ID = "test-client"; process.env.BATTLENET_CLIENT_SECRET = "test-secret"; process.env.PREPULL_CHARACTER_PROVIDER = "mock";
  globalThis.fetch = async (input) => {
    const url = String(input); calls += 1;
    if (url.includes("oauth.battle.net")) return Response.json({ access_token: "test-only", expires_in: 3600 });
    if (url.includes("/specializations")) return Response.json({}, { status: 404 });
    if (url.includes("/statistics")) return Response.json({}, { status: 503 });
    if (url.includes("/equipment")) return failEquipment ? Response.json({}, { status: 503 }) : Response.json({ equipped_items: [{ item: { id: 21329 }, slot: { type: "HEAD" }, name: "Known helm" }] });
    return Response.json({ id: 123, name: "Example", level: 60, realm: { name: "Firemaw" }, character_class: { name: "Warrior" } });
  };
  try {
    const provider = new BattleNetCharacterProvider(); characterCache.clear();
    const synced = await provider.findCharacter(lookup);
    assert.equal(synced.equipment[0].itemId, 21329); assert.equal(synced.armory?.talents.status, "unavailable"); assert.equal(synced.armory?.statistics.status, "temporary-error"); assert.equal(calls, 5);
    await provider.findCharacter(lookup); assert.equal(calls, 5);
    failEquipment = true; characterCache.clear();
    const publicCharacter = await provider.findPublicCharacter(lookup); assert.equal(publicCharacter.equipmentStatus, "unavailable"); assert.equal(publicCharacter.name, "Example");
    await assert.rejects(provider.findCharacter(lookup), /Equipment could not be loaded/);
    const before = calls; await assert.rejects(provider.findCharacter({ ...lookup, realmType: "anniversary" }), /not currently verified/); assert.equal(calls, before);
  } finally { globalThis.fetch = previousFetch; characterCache.clear(); for (const key of ["BATTLENET_CLIENT_ID", "BATTLENET_CLIENT_SECRET", "PREPULL_CHARACTER_PROVIDER"]) { if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key]; } }
});

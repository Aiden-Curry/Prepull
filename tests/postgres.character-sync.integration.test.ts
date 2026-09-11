import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const enabled = Boolean(process.env.TEST_DATABASE_URL);
const { query, closePool } = await import("../lib/guilds/db.ts");
const { SavedCharacterRepository } = await import("../lib/characters/saved-repository.ts");
const { CharacterSyncRepository } = await import("../lib/characters/sync-repository.ts");
const { characterFromSync } = await import("../lib/characters/sync-repository.ts");
const { eraFuryFixtures } = await import("../lib/gear-analysis/fixtures.ts");
const { eraFrostMageFixtures } = await import("../lib/gear-analysis/mage-fixtures.ts");
const { buildPlayerAdvice } = await import("../lib/player-advice/service.ts");
const { completedTargetNames } = await import("../lib/characters/sync-service.ts");
const saved = new SavedCharacterRepository(); const syncs = new CharacterSyncRepository();
test("character sync snapshots persist latest, previous, items, and failures without replacing success", { skip: !enabled }, async () => { const userId = randomUUID(); await query("INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,'x','Sync Owner')", [userId, `${userId}@sync.local`]); const character = await saved.saveCharacter(userId, { region: "eu", realmSlug: "firemaw", realmName: "Firemaw", characterName: "Freshfury", normalizedCharacterName: "freshfury", characterRealmType: "era", contentVersion: "era", className: "Warrior", level: 60, race: "Orc", faction: "Horde" }); try { const first = await syncs.recordSuccess(character.id, eraFuryFixtures.fresh60); const changed = { ...eraFuryFixtures.fresh60, equipment: eraFuryFixtures.fresh60.equipment.map((item, index) => index === 0 ? { ...item, itemId: 999001, name: "Changed Helm" } : item) }; const second = await syncs.recordSuccess(character.id, changed); assert.equal((await syncs.getLatestSuccessful(character.id))?.id, second.id); assert.equal((await syncs.getPreviousSuccessful(character.id))?.id, first.id); assert.equal((await syncs.getLatestSuccessful(character.id))?.equipment.find((item) => item.slot === "Head")?.itemId, 999001); await syncs.recordFailure(character.id, { provider: "mock", contentVersion: "era", characterRealmType: "era", code: "ProviderUnavailable", message: "Temporary failure" }); assert.equal((await syncs.getLatestSuccessful(character.id))?.id, second.id); assert.equal((await syncs.getLatestAttempt(character.id))?.status, "failed"); } finally { await query("DELETE FROM user_characters WHERE id=$1", [character.id]); await query("DELETE FROM users WHERE id=$1", [userId]); } });
test("Frost Mage refresh snapshots persist and completed targets recalculate advice", { skip: !enabled }, async () => {
  const userId = randomUUID();
  await query("INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,'x','Mage Sync Owner')", [userId, `${userId}@mage-sync.local`]);
  const savedCharacter = await saved.saveCharacter(userId, { region: "us", realmSlug: "whitemane", realmName: "Whitemane", characterName: "Lyria", normalizedCharacterName: "lyria", characterRealmType: "era", contentVersion: "era", className: "Mage", level: 60, race: "Human", faction: "Alliance" });
  try {
    await syncs.recordSuccess(savedCharacter.id, eraFrostMageFixtures.browserBaseline);
    await syncs.recordSuccess(savedCharacter.id, eraFrostMageFixtures.browserProgressed);
    const latest = (await syncs.getLatestSuccessful(savedCharacter.id))!;
    const previous = (await syncs.getPreviousSuccessful(savedCharacter.id))!;
    const identity = { id: savedCharacter.id, name: savedCharacter.characterName, region: savedCharacter.region, realmName: savedCharacter.realmName, contentVersion: savedCharacter.contentVersion, characterRealmType: savedCharacter.characterRealmType };
    const before = characterFromSync(identity, previous);
    const after = characterFromSync(identity, latest);
    const beforeAdvice = buildPlayerAdvice(before).advice;
    const afterAdvice = buildPlayerAdvice(after).advice;
    const targetIds = new Set([...beforeAdvice.topActions, ...beforeAdvice.secondaryActions].flatMap((action) => action.targets.map((target) => target.itemId)));
    assert.equal(latest.className, "Mage");
    assert.equal(latest.spec, "Frost");
    assert.equal(latest.equipment.length, 17);
    assert.deepEqual(completedTargetNames(before, after, targetIds), ["Fordring's Seal"]);
    assert.ok(afterAdvice.summary.actionableUpgradeCount < beforeAdvice.summary.actionableUpgradeCount);
  } finally {
    await query("DELETE FROM user_characters WHERE id=$1", [savedCharacter.id]);
    await query("DELETE FROM users WHERE id=$1", [userId]);
  }
});
test.after(async () => closePool());

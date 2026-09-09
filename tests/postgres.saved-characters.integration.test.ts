import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const enabled = Boolean(process.env.TEST_DATABASE_URL);
const { query, closePool } = await import("../lib/guilds/db.ts");
const { SavedCharacterRepository } = await import("../lib/characters/saved-repository.ts");
const repo = new SavedCharacterRepository();
const character = (name: string, realmType: "era" | "anniversary" = "era", contentVersion: "era" | "tbc" = "era") => ({ region: "eu" as const, realmSlug: "firemaw", realmName: "Firemaw", characterName: name, normalizedCharacterName: name.toLowerCase(), characterRealmType: realmType, contentVersion, className: "Warrior", level: 60, race: "Orc", faction: "Horde" as const });

test("saved characters are isolated, deduplicated, and primary selection is transactional", { skip: !enabled }, async () => {
  const first = randomUUID(); const second = randomUUID();
  await query("INSERT INTO users(id,email,password_hash,name) VALUES($1,$2,'x','Saved One'),($3,$4,'x','Saved Two')", [first, `${first}@saved`, second, `${second}@saved`]);
  try {
    const one = await repo.saveCharacter(first, character("Aidy"));
    const duplicate = await repo.saveCharacter(first, character("Aidy"));
    const samePublicCharacter = await repo.saveCharacter(second, character("Aidy"));
    assert.equal(one.id, duplicate.id); assert.notEqual(one.id, samePublicCharacter.id); assert.equal(one.isPrimary, true);
    const alt = await repo.saveCharacter(first, character("Lyria"));
    await repo.setPrimaryCharacter(first, alt.id);
    assert.equal((await repo.getPrimaryCharacter(first))?.id, alt.id);
    await assert.rejects(() => repo.setPrimaryCharacter(second, alt.id), /not found/i);
    await assert.rejects(() => repo.removeSavedCharacter(second, one.id), /not found/i);
    await repo.removeSavedCharacter(first, alt.id);
    assert.equal((await repo.getPrimaryCharacter(first))?.id, one.id);
    const anniversary = await repo.saveCharacter(first, character("Aidy", "anniversary", "tbc"));
    assert.notEqual(anniversary.id, one.id);
    await repo.removeSavedCharacter(first, anniversary.id);
    await repo.removeSavedCharacter(first, one.id);
    assert.equal(await repo.getPrimaryCharacter(first), undefined);
    await assert.rejects(() => repo.setPrimaryCharacter(first, one.id), /not found/i);
  } finally {
    await query("DELETE FROM user_characters WHERE user_id=ANY($1::uuid[])", [[first, second]]);
    await query("DELETE FROM users WHERE id=ANY($1::uuid[])", [[first, second]]);
  }
});

test.after(async () => closePool());

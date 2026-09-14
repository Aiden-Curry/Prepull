import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const enabled = Boolean(process.env.TEST_DATABASE_URL);
const { query, closePool } = await import("../lib/guilds/db.ts");
const { registerAccount } = await import("../lib/accounts/signup.ts");
const { SavedCharacterRepository } = await import("../lib/characters/saved-repository.ts");
const saved = new SavedCharacterRepository();

test("registration persists a normalized unique bcrypt account and survives repository recreation", { skip: !enabled }, async () => {
  const token = randomUUID(); const email = `${token}@signup.local`; const password = "correct horse battery staple";
  try {
    const created = await registerAccount({ email: `  ${email.toUpperCase()}  `, password, confirmPassword: password });
    assert.equal(created.ok, true); if (!created.ok) return;
    const row = (await query<{ id: string; email: string; password_hash: string }>("SELECT id,email,password_hash FROM users WHERE id=$1", [created.account.id])).rows[0];
    assert.equal(row.email, email); assert.notEqual(row.password_hash, password); assert.equal(await bcrypt.compare(password, row.password_hash), true);
    await assert.rejects(() => registerAccount({ email, password, confirmPassword: password }), /already exists/i);
    assert.equal((await query("SELECT id FROM users WHERE lower(email)=$1", [email])).rowCount, 1);
  } finally { await query("DELETE FROM users WHERE lower(email)=$1", [email]); }
});

test("new-account character ownership is isolated and duplicate saves reuse one row", { skip: !enabled }, async () => {
  const first = randomUUID(); const second = randomUUID(); const emailOne = `${first}@signup.local`; const emailTwo = `${second}@signup.local`; const password = "correct horse battery staple";
  try {
    const one = await registerAccount({ email: emailOne, password, confirmPassword: password }); const two = await registerAccount({ email: emailTwo, password, confirmPassword: password });
    assert.equal(one.ok && two.ok, true); if (!one.ok || !two.ok) return;
    const input = { region: "eu" as const, realmSlug: "firemaw", realmName: "Firemaw", characterName: "Aidy", normalizedCharacterName: "aidy", characterRealmType: "era" as const, contentVersion: "era" as const, className: "Warrior", level: 60, race: "Orc", faction: "Horde" as const };
    const savedOne = await saved.saveCharacter(one.account.id, input); const duplicate = await new SavedCharacterRepository().saveCharacter(one.account.id, input); const savedTwo = await saved.saveCharacter(two.account.id, input);
    assert.equal(savedOne.id, duplicate.id); assert.notEqual(savedOne.id, savedTwo.id); assert.equal((await saved.listSavedCharacters(one.account.id)).length, 1); assert.equal((await saved.listSavedCharacters(two.account.id)).length, 1);
  } finally { await query("DELETE FROM users WHERE lower(email)=ANY($1::text[])", [[emailOne, emailTwo]]); }
});

test.after(async () => closePool());

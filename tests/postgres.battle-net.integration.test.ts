import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const enabled = Boolean(process.env.TEST_DATABASE_URL);
const { query, closePool } = await import("../lib/guilds/db.ts");
const { BattleNetRepository, BattleNetDomainError } = await import("../lib/battle-net/repository.ts");
const repo = new BattleNetRepository(); const users: string[] = [];

test("Battle.net login creates no invented credentials and returning login reuses it", { skip: !enabled }, async () => {
  const subject = `subject-${randomUUID()}`;
  const first = await repo.connectIdentity({ intent: "login", region: "eu", identity: { subject, accountId: "42", battleTag: "Aidy#1234" } }); users.push(first.userId);
  const second = await new BattleNetRepository().connectIdentity({ intent: "login", region: "eu", identity: { subject, accountId: "42", battleTag: "Renamed#1234" } });
  assert.equal(first.createdUser, true); assert.equal(second.userId, first.userId); assert.equal(second.reauthorized, true);
  const row = (await query<{ email: string | null; password_hash: string | null }>("SELECT email,password_hash FROM users WHERE id=$1", [first.userId])).rows[0]; assert.equal(row.email, null); assert.equal(row.password_hash, null);
});

test("linking is current-user scoped and collision-safe", { skip: !enabled }, async () => {
  const a = (await query<{ id: string }>("INSERT INTO users(email,password_hash,name) VALUES($1,'hash','A') RETURNING id", [`${randomUUID()}@battle-net.test`])).rows[0].id;
  const b = (await query<{ id: string }>("INSERT INTO users(email,password_hash,name) VALUES($1,'hash','B') RETURNING id", [`${randomUUID()}@battle-net.test`])).rows[0].id; users.push(a, b);
  const subject = `subject-${randomUUID()}`; await repo.connectIdentity({ intent: "link", initiatingUserId: a, region: "us", identity: { subject, battleTag: "Owner#1" } });
  await assert.rejects(() => repo.connectIdentity({ intent: "link", initiatingUserId: b, region: "us", identity: { subject, battleTag: "Owner#1" } }), (error: unknown) => error instanceof BattleNetDomainError && error.code === "collision");
  assert.equal((await query("SELECT id FROM battle_net_connections WHERE provider_region='us' AND provider_subject=$1", [subject])).rows.length, 1);
});

test("OAuth state is one-time, browser-bound, intent-bound, and expiring", { skip: !enabled }, async () => {
  const user = (await query<{ id: string }>("INSERT INTO users(email,password_hash,name) VALUES($1,'hash','State') RETURNING id", [`${randomUUID()}@battle-net.test`])).rows[0].id; users.push(user);
  await repo.createOAuthState({ stateHash: "a".repeat(64), browserBindingHash: "b".repeat(64), region: "eu", intent: "link", initiatingUserId: user, contentVersion: "tbc", callbackUrl: "/tbc/calendar", expiresAt: new Date(Date.now() + 60_000) });
  await assert.rejects(() => repo.consumeOAuthState("a".repeat(64), "c".repeat(64))); const state = await repo.consumeOAuthState("a".repeat(64), "b".repeat(64)); assert.equal(state.callbackUrl, "/tbc/calendar"); assert.equal(state.initiatingUserId, user); await assert.rejects(() => repo.consumeOAuthState("a".repeat(64), "b".repeat(64)));
});

test("import sessions enforce ownership, expiry, unsupported status, and discovered duplicates", { skip: !enabled }, async () => {
  const connection = await repo.connectIdentity({ intent: "login", region: "eu", identity: { subject: `subject-${randomUUID()}`, battleTag: "Import#1" } }); users.push(connection.userId);
  const character = { providerCharacterId: "1", name: "Aidy", normalizedName: "aidy", realmName: "Firemaw", realmSlug: "firemaw", region: "eu" as const, realmType: "era" as const, contentSupport: "supported" as const };
  const id = await repo.createImportSession({ userId: connection.userId, connectionId: connection.connectionId, contentVersion: "era", callbackUrl: "/era/dashboard", discoveryStatus: "complete", expiresAt: new Date(Date.now() + 60_000), characters: [character, character, { ...character, name: "Whimsy", normalizedName: "whimsy", realmType: "anniversary", contentSupport: "unsupported" }] });
  const session = await new BattleNetRepository().getImportSession(connection.userId, id); assert.equal(session.characters.length, 2); assert.equal(session.characters.find((item) => item.name === "Whimsy")?.importStatus, "unsupported"); await assert.rejects(() => repo.getImportSession(randomUUID(), id));
  await repo.createLoginGrant("c".repeat(64), connection.userId, id, new Date(Date.now() + 60_000)); const grant = await repo.consumeLoginGrant("c".repeat(64)); assert.equal(grant?.id, connection.userId); assert.equal(await repo.consumeLoginGrant("c".repeat(64)), undefined);
  await repo.createLoginGrant("d".repeat(64), connection.userId, id, new Date(Date.now() - 1)); assert.equal(await repo.consumeLoginGrant("d".repeat(64)), undefined);
  await query("UPDATE battle_net_import_sessions SET expires_at=now()-interval '1 second' WHERE id=$1", [id]); await assert.rejects(() => repo.getImportSession(connection.userId, id), (error: unknown) => error instanceof BattleNetDomainError && error.code === "expired");
});

test.after(async () => { if (enabled && users.length) await query("DELETE FROM users WHERE id=ANY($1::uuid[])", [users]); await closePool(); });

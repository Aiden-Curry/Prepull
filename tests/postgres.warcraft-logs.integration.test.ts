import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { logsFixture } from "../lib/warcraft-logs/fixtures.ts";
import { emptyLogs } from "../lib/warcraft-logs/model.ts";
import { LogsService } from "../lib/warcraft-logs/service.ts";
import { WclTransportError } from "../lib/warcraft-logs/transport.ts";

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const enabled = Boolean(process.env.TEST_DATABASE_URL);
const { query, closePool } = await import("../lib/guilds/db.ts");
const { PostgresLogsCache } = await import("../lib/warcraft-logs/cache.ts");
const keys: string[] = [];
const key = () => { const value = `test:wcl:${randomUUID()}`; keys.push(value); return value; };

test("PostgreSQL WCL cache survives service recreation and stores only normalized public fields", { skip: !enabled }, async () => {
  const id = key(); let calls = 0;
  const first = new LogsService(new PostgresLogsCache());
  const provider = async () => { calls++; return { ...logsFixture("logsfull"), access_token: "must-not-persist", userId: "must-not-persist" }; };
  assert.equal((await first.lookup(id, provider, async () => true)).summary.status, "available");
  const second = new LogsService(new PostgresLogsCache());
  assert.equal((await second.lookup(id, provider, async () => { assert.fail("Fresh hit consumes no quota"); })).freshness, "fresh");
  assert.equal(calls, 1);
  const row = (await query("SELECT * FROM warcraft_logs_cache WHERE cache_key=$1", [id])).rows[0];
  assert.doesNotMatch(JSON.stringify(row), /must-not-persist|access_token|userId/);
  assert.equal(row.lease_owner, null);
});
test("PostgreSQL WCL refresh lease bounds concurrent calls across service instances", { skip: !enabled }, async () => {
  const id = key(); let calls = 0;
  const provider = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 50)); return logsFixture("logsfull"); };
  const results = await Promise.all(Array.from({ length: 12 }, () => new LogsService(new PostgresLogsCache()).lookup(id, provider, async () => true)));
  assert.equal(calls, 1); assert.ok(results.every(result => result.summary.status === "available"));
});
test("PostgreSQL WCL expired lease recovery rejects old-owner writes", { skip: !enabled }, async () => {
  const id = key(), cache = new PostgresLogsCache(), oldOwner = randomUUID(), newOwner = randomUUID();
  const now = Date.now();
  assert.equal(await cache.acquire(id, oldOwner, now), true);
  assert.equal(await cache.acquire(id, newOwner, now + 1), false);
  assert.equal(await cache.acquire(id, newOwner, now + 45_001), true);
  await cache.save(id, oldOwner, logsFixture("logsfull"), now + 100_000, now + 200_000, now);
  assert.equal((await cache.get(id))?.summary, undefined);
  await cache.save(id, newOwner, emptyLogs("hidden"), now + 100_000, now + 100_000, now);
  assert.equal((await cache.get(id))?.summary?.status, "hidden");
});
test("PostgreSQL WCL preserves bounded stale on transient failure, then replaces it on hidden", { skip: !enabled }, async () => {
  const id = key(), cache = new PostgresLogsCache(); let now = Date.now();
  const service = new LogsService(cache, { now: () => now });
  await service.lookup(id, async () => logsFixture("logsfull"), async () => true);
  now += 900_001;
  const stale = await service.lookup(id, async () => { throw new WclTransportError("rate-limit", 60); }, async () => true);
  assert.equal(stale.freshness, "stale");
  assert.equal((await cache.get(id))?.retryAfter, now + 60_000);
  now += 60_001;
  await service.lookup(id, async () => emptyLogs("hidden"), async () => true);
  const row = await cache.get(id); assert.equal(row?.summary?.status, "hidden"); assert.deepEqual(row?.summary?.raids, []); assert.equal(row?.freshUntil, row?.staleUntil);
});
test("PostgreSQL WCL has no trusted-state foreign keys or secret columns", { skip: !enabled }, async () => {
  const foreignKeys = await query("SELECT conname FROM pg_constraint WHERE conrelid='warcraft_logs_cache'::regclass AND contype='f'");
  assert.equal(foreignKeys.rowCount, 0);
  const columns = await query("SELECT column_name FROM information_schema.columns WHERE table_name='warcraft_logs_cache'");
  assert.doesNotMatch(JSON.stringify(columns.rows), /access_token|client_secret|user_id|character_id|guild_id/);
});
test.after(async () => { if (enabled) await query("DELETE FROM warcraft_logs_cache WHERE cache_key=ANY($1::text[])", [keys]); await closePool(); });

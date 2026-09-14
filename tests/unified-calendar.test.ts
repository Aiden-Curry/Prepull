import assert from "node:assert/strict";
import test from "node:test";
import type { GuildScheduleEntry } from "../lib/guilds/schedule.ts";
import { buildUnifiedCalendarProjection, filterUnifiedCalendar, selectUnifiedDashboardEntries } from "../lib/calendar/unified.ts";
import type { GameCalendarEvent } from "../lib/calendar/types.ts";

const source = { label: "Reviewed source", url: "https://example.com/event", verifiedAt: "2026-09-13" };
const game = (overrides: Partial<GameCalendarEvent> = {}): GameCalendarEvent => ({ id: "game-eu", familyId: "event", contentVersion: "era", title: "Game Event", category: "holiday", region: "eu", timing: { kind: "date-range", startsOn: "2026-09-14", endsOn: "2026-09-16" }, source, ...overrides });
const guild = (overrides: Partial<GuildScheduleEntry> = {}): GuildScheduleEntry => ({ id: "raid", type: "raid", title: "Molten Core", scheduledFor: "2026-09-14T17:00:00Z", guildLocalDate: "2026-09-14", guildLocalTime: "19:00", linkedRaidId: "raid", status: "open", ...overrides });
const schedule = (entries: GuildScheduleEntry[] = [guild()], timeZone = "Europe/Oslo") => ({ guildId: "guild", guildName: "Test Guild", timeZone, entries, unscheduled: [{ id: "unscheduled", title: "Blackrock Depths", linkedRaidId: "raid", raidName: "Molten Core" }] });
const now = new Date("2026-09-14T12:00:00Z");

test("merges active date-only game events and today's timed guild entries without inventing a game timestamp", () => {
  const result = buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: [game()], schedule: schedule(), now });
  assert.deepEqual(result.happeningNow.map((entry) => entry.kind), ["game-event", "raid"]);
  const event = result.happeningNow[0];
  if (event.kind === "game-event") assert.deepEqual(event.timing, { kind: "date-range", startsOn: "2026-09-14", endsOn: "2026-09-16" });
});

test("mixed precision ordering puts timed guild entries before starting date-only events on the same upcoming day", () => {
  const events = [game({ timing: { kind: "date-range", startsOn: "2026-09-15" } })];
  const entries = [guild({ id: "late", guildLocalDate: "2026-09-15", guildLocalTime: "20:30" }), guild({ id: "early", title: "Early Raid", guildLocalDate: "2026-09-15", guildLocalTime: "19:00" })];
  const result = buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: events, schedule: schedule(entries), now });
  assert.deepEqual(result.upcoming.map((entry) => entry.id), ["early", "late", "game-eu"]);
});

test("region changes affect game entries but preserve guild projections", () => {
  const events = [game(), game({ id: "game-us", region: "us", title: "US Event" })];
  const eu = buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: events, schedule: schedule(), now });
  const us = buildUnifiedCalendarProjection({ version: "era", region: "us", gameEvents: events, schedule: schedule(), now });
  assert.equal(eu.happeningNow.find((entry) => entry.kind === "game-event")?.title, "Game Event");
  assert.equal(us.happeningNow.find((entry) => entry.kind === "game-event")?.title, "US Event");
  assert.deepEqual(eu.happeningNow.filter((entry) => entry.kind !== "game-event"), us.happeningNow.filter((entry) => entry.kind !== "game-event"));
});

test("guild timezone presentation can change without changing game occurrence dates", () => {
  const oslo = buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: [game()], schedule: schedule([guild()], "Europe/Oslo"), now });
  const ny = buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: [game()], schedule: schedule([guild({ guildLocalTime: "13:00" })], "America/New_York"), now });
  const osloRaid = oslo.happeningNow.find((entry) => entry.kind === "raid"); const nyRaid = ny.happeningNow.find((entry) => entry.kind === "raid");
  if (osloRaid?.kind === "raid" && nyRaid?.kind === "raid") { assert.equal(osloRaid.guildLocalTime, "19:00"); assert.equal(nyRaid.guildLocalTime, "13:00"); }
  assert.deepEqual(oslo.happeningNow.find((entry) => entry.kind === "game-event"), ny.happeningNow.find((entry) => entry.kind === "game-event"));
});

test("filters preserve source identity and keep unscheduled runs outside chronology", () => {
  const result = buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: [game()], schedule: schedule(), now });
  assert.equal(result.unscheduled.length, 1); assert.ok(result.upcoming.every((entry) => entry.id !== "unscheduled"));
  assert.deepEqual(filterUnifiedCalendar(result, "guild").happeningNow.map((entry) => entry.kind), ["raid"]);
  assert.equal(filterUnifiedCalendar(result, "holidays").happeningNow[0].kind, "game-event");
  assert.equal(filterUnifiedCalendar(result, "holidays").unscheduled.length, 0);
  const event = result.happeningNow[0]; if (event.kind === "game-event") assert.equal(event.source.label, "Reviewed source");
});

test("completed raids and closed Prep Runs are excluded defensively", () => {
  const entries = [guild({ id: "complete", status: "complete" }), guild({ id: "closed", type: "prep-run", status: "closed", prepRunId: "closed" }), guild({ id: "open-prep", type: "prep-run", status: "open", prepRunId: "open-prep" })];
  const result = buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: [], schedule: schedule(entries), now });
  assert.deepEqual(result.happeningNow.map((entry) => entry.id), ["open-prep"]);
});

test("content version isolation and deterministic now are preserved", () => {
  const events = [game(), game({ id: "tbc", contentVersion: "tbc", title: "TBC Event" })];
  const era = buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: events, schedule: schedule([]), now });
  const tbc = buildUnifiedCalendarProjection({ version: "tbc", region: "eu", gameEvents: events, schedule: schedule([]), now });
  assert.equal(era.happeningNow[0].title, "Game Event"); assert.equal(tbc.happeningNow[0].title, "TBC Event");
  assert.deepEqual(era, buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: events, schedule: schedule([]), now }));
});

test("projection serialization contains no player-private fields", () => {
  const serialized = JSON.stringify(buildUnifiedCalendarProjection({ version: "era", region: "eu", gameEvents: [game()], schedule: schedule(), now })).toLowerCase();
  for (const forbidden of ["readiness", "equipment", "savedcharacter", "synchistory", "sessionplanner", "email", "userid", "maybenefit"]) assert.equal(serialized.includes(forbidden), false, forbidden);
});

test("dashboard preview stays compact while retaining private guild activity beside game events", () => {
  const projection = buildUnifiedCalendarProjection({
    version: "era",
    region: "eu",
    gameEvents: [
      game(),
      game({ id: "game-two", title: "Second Game Event" }),
      game({ id: "game-three", title: "Third Game Event" }),
    ],
    schedule: schedule(),
    now,
  });
  const preview = selectUnifiedDashboardEntries(projection, 3);
  assert.equal(preview.length, 3);
  assert.ok(preview.some((entry) => entry.kind === "game-event"));
  assert.ok(preview.some((entry) => entry.kind !== "game-event"));
});

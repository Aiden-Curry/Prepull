import assert from "node:assert/strict";
import test from "node:test";
import { getAllCalendarEvents, getCalendarEvents } from "../lib/calendar/registry.ts";
import { calendarEventStatus, filterCalendarEvents, parseCalendarRegion, selectDashboardEvents, sortCalendarEvents } from "../lib/calendar/service.ts";
import type { GameCalendarEvent } from "../lib/calendar/types.ts";
import { validateCalendarEvents } from "../lib/calendar/validate.ts";

const source = { label: "Test source", url: "https://example.com/source", verifiedAt: "2026-09-13" };
const dateEvent = (overrides: Partial<GameCalendarEvent> = {}): GameCalendarEvent => ({ id: "test-event", familyId: "test-family", contentVersion: "era", title: "Test", category: "holiday", region: "global", timing: { kind: "date-range", startsOn: "2026-09-13", endsOn: "2026-09-15" }, source, ...overrides });

test("published calendar data passes structural validation", () => assert.deepEqual(validateCalendarEvents(getAllCalendarEvents()), []));
test("validation rejects duplicate IDs, duplicate occurrences, invalid ranges, dates, provenance, and URLs", () => {
  const invalid = dateEvent({ id: "Bad ID", source: { label: "", url: "javascript:bad", verifiedAt: "2026-02-30" }, timing: { kind: "date-range", startsOn: "2026-09-15", endsOn: "2026-09-13" } });
  const errors = validateCalendarEvents([invalid, invalid]);
  for (const fragment of ["invalid id", "duplicate id", "source label", "verifiedAt", "source URL", "end precedes start", "duplicates an existing"]) assert.ok(errors.some((error) => error.includes(fragment)), fragment);
});
test("validation accepts offset-aware instants and rejects offset-free instants", () => {
  assert.deepEqual(validateCalendarEvents([dateEvent({ timing: { kind: "instant-range", startsAt: "2026-09-13T10:00:00Z", endsAt: "2026-09-13T11:00:00+00:00" } })]), []);
  assert.ok(validateCalendarEvents([dateEvent({ timing: { kind: "instant-range", startsAt: "2026-09-13T10:00:00" } })]).some((error) => error.includes("offset-aware")));
});
test("validation rejects unknown version, region, and category values", () => {
  const errors = validateCalendarEvents([dateEvent({ contentVersion: "forever", region: "moon", category: "raid" } as unknown as Partial<GameCalendarEvent>)]);
  for (const fragment of ["contentVersion", "region", "category"]) assert.ok(errors.some((error) => error.includes(fragment)), fragment);
});
test("filtering isolates version, region, and category while retaining global events", () => {
  const events = [dateEvent(), dateEvent({ id: "eu-bg", familyId: "eu-bg", region: "eu", category: "battleground" }), dateEvent({ id: "us-bg", familyId: "us-bg", region: "us", category: "battleground" }), dateEvent({ id: "tbc-only", familyId: "tbc-only", contentVersion: "tbc" })];
  assert.deepEqual(filterCalendarEvents(events, { version: "era", region: "eu", category: "battlegrounds" }).map((event) => event.id), ["eu-bg"]);
  assert.deepEqual(filterCalendarEvents(events, { version: "era", region: "us" }).map((event) => event.id), ["test-event", "us-bg"]);
  assert.ok(getCalendarEvents("era").every((event) => event.contentVersion === "era")); assert.ok(getCalendarEvents("tbc").every((event) => event.contentVersion === "tbc"));
});
test("sorting is deterministic by start, end, title, then id", () => {
  const events = [dateEvent({ id: "z", title: "Zulu", timing: { kind: "date-range", startsOn: "2026-10-01" } }), dateEvent({ id: "b", title: "Alpha" }), dateEvent({ id: "a", title: "Alpha" })];
  assert.deepEqual(sortCalendarEvents(events).map((event) => event.id), ["a", "b", "z"]);
});
test("date-only status is inclusive and uses injected now", () => {
  assert.equal(calendarEventStatus(dateEvent(), new Date("2026-09-12T12:00:00Z"), "eu"), "upcoming");
  assert.equal(calendarEventStatus(dateEvent(), new Date("2026-09-15T12:00:00Z"), "eu"), "active");
  assert.equal(calendarEventStatus(dateEvent(), new Date("2026-09-16T12:00:00Z"), "eu"), "ended");
});
test("date-only status observes the selected region's civil-date boundary", () => {
  const event = dateEvent({ timing: { kind: "date-range", startsOn: "2026-09-13" } }); const now = new Date("2026-09-13T01:00:00Z");
  assert.equal(calendarEventStatus(event, now, "eu"), "active"); assert.equal(calendarEventStatus(event, now, "us"), "upcoming");
});
test("instant status uses exact instants", () => {
  const event = dateEvent({ timing: { kind: "instant-range", startsAt: "2026-09-13T10:00:00Z", endsAt: "2026-09-13T11:00:00Z" } });
  assert.equal(calendarEventStatus(event, new Date("2026-09-13T10:30:00Z"), "us"), "active"); assert.equal(calendarEventStatus(event, new Date("2026-09-13T12:00:00Z"), "us"), "ended");
});
test("dashboard selection excludes ended events and respects limit/version", () => {
  const selected = selectDashboardEvents(getAllCalendarEvents(), "tbc", "eu", new Date("2026-09-13T12:00:00Z"), 2);
  assert.equal(selected.length, 2); assert.ok(selected.every((event) => event.contentVersion === "tbc"));
});
test("region parsing is explicit and safely defaults to EU", () => { assert.equal(parseCalendarRegion("us"), "us"); assert.equal(parseCalendarRegion("kr"), "eu"); });

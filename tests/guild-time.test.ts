import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  analyzeGuildLocalDateTime,
  describeRelativeGuildDate,
  formatInGuildTimeZone,
  guildLocalDateTimeToUtc,
  instantToGuildLocalInput,
  isValidIanaTimeZone,
  validateTimeZone,
} from "../lib/guilds/time.ts";

const convert = (localDate: string, localTime: string, timeZone: string) =>
  guildLocalDateTimeToUtc({ localDate, localTime }, timeZone);

test("IANA validation accepts named zones and rejects aliases, offsets, and arbitrary input", () => {
  for (const zone of [
    "UTC",
    "Europe/Oslo",
    "Europe/London",
    "America/New_York",
    "Asia/Tokyo",
    "Australia/Sydney",
  ])
    assert.equal(isValidIanaTimeZone(zone), true, zone);
  for (const zone of [
    "UTC+2",
    "GMT+1",
    "CET",
    "EST",
    "foobar",
    "Europe/FakeCity",
    "Etc/GMT+2",
  ])
    assert.equal(isValidIanaTimeZone(zone), false, zone);
  assert.equal(validateTimeZone(), "UTC");
});

test("guild wall time converts with winter and summer offsets without machine-timezone dependence", () => {
  assert.equal(convert("2026-01-15", "19:00", "UTC"), "2026-01-15T19:00:00Z");
  assert.equal(
    convert("2026-01-15", "19:00", "Europe/Oslo"),
    "2026-01-15T18:00:00Z",
  );
  assert.equal(
    convert("2026-07-15", "19:00", "Europe/Oslo"),
    "2026-07-15T17:00:00Z",
  );
  assert.equal(
    convert("2026-01-15", "19:00", "Europe/London"),
    "2026-01-15T19:00:00Z",
  );
  assert.equal(
    convert("2026-07-15", "19:00", "Europe/London"),
    "2026-07-15T18:00:00Z",
  );
  assert.equal(
    convert("2026-01-15", "19:00", "America/New_York"),
    "2026-01-16T00:00:00Z",
  );
  assert.equal(
    convert("2026-07-15", "19:00", "America/New_York"),
    "2026-07-15T23:00:00Z",
  );
  assert.equal(
    convert("2026-07-15", "19:00", "Asia/Tokyo"),
    "2026-07-15T10:00:00Z",
  );
});

test("conversion covers date/year boundaries and round trips the same guild wall time", () => {
  assert.equal(
    convert("2027-01-01", "00:30", "Asia/Tokyo"),
    "2026-12-31T15:30:00Z",
  );
  const instant = convert("2026-12-31", "23:30", "America/New_York");
  assert.deepEqual(instantToGuildLocalInput(instant, "America/New_York"), {
    localDate: "2026-12-31",
    localTime: "23:30",
    offset: "-05:00",
  });
  assert.equal(
    formatInGuildTimeZone("2026-12-31T15:30:00Z", "Asia/Tokyo", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
    "01/01/2027, 00:30",
  );
});

test("spring gaps are rejected and fall-back overlaps require an explicit offset", () => {
  assert.equal(
    analyzeGuildLocalDateTime("2026-03-29", "02:30", "Europe/Oslo").kind,
    "nonexistent",
  );
  assert.throws(
    () => convert("2026-03-29", "02:30", "Europe/Oslo"),
    /does not exist/i,
  );
  const overlap = analyzeGuildLocalDateTime(
    "2026-10-25",
    "02:30",
    "Europe/Oslo",
  );
  assert.equal(overlap.kind, "ambiguous");
  if (overlap.kind !== "ambiguous") return;
  assert.deepEqual(
    overlap.choices.map((choice) => choice.offset),
    ["+02:00", "+01:00"],
  );
  assert.throws(
    () => convert("2026-10-25", "02:30", "Europe/Oslo"),
    /occurs twice/i,
  );
  assert.equal(
    guildLocalDateTimeToUtc(
      { localDate: "2026-10-25", localTime: "02:30", offsetChoice: "+02:00" },
      "Europe/Oslo",
    ),
    "2026-10-25T00:30:00Z",
  );
  assert.equal(
    guildLocalDateTimeToUtc(
      { localDate: "2026-10-25", localTime: "02:30", offsetChoice: "+01:00" },
      "Europe/Oslo",
    ),
    "2026-10-25T01:30:00Z",
  );
});

test("relative dates use the guild date, including Tokyo crossing UTC midnight", () => {
  const now = "2026-09-13T14:30:00Z";
  assert.equal(
    describeRelativeGuildDate("2026-09-13T15:15:00Z", "UTC", now),
    "Today",
  );
  assert.equal(
    describeRelativeGuildDate("2026-09-13T15:15:00Z", "Asia/Tokyo", now),
    "Tomorrow",
  );
});

test("schedule and timezone modules have no character-provider dependency", () => {
  const source = ["lib/guilds/time.ts", "lib/guilds/schedule.ts"]
    .map((path) => fs.readFileSync(path, "utf8"))
    .join("\n");
  assert.doesNotMatch(
    source,
    /getCharacterProvider|providers\/factory|findCharacter|refreshCharacter|Battle\.net|character_sync/i,
  );
});

test("unified calendar remains a presentation projection with no provider or readiness dependency", () => {
  const source = [
    "lib/calendar/unified.ts",
    "app/[version]/guilds/[guildId]/calendar/page.tsx",
  ]
    .map((path) => fs.readFileSync(path, "utf8"))
    .join("\n");
  assert.doesNotMatch(
    source,
    /getCharacterProvider|providers\/factory|findCharacter|refreshCharacter|character_sync|PlayerAdvice|readiness|globalThis\.fetch|fetch\(/i,
  );
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { switchContentVersionHref, versionedHref } from "../lib/navigation.ts";

test("versionedHref normalizes versioned application paths", () => {
  assert.equal(versionedHref("era", "/dashboard"), "/era/dashboard");
  assert.equal(versionedHref("tbc", "guilds"), "/tbc/guilds");
  assert.equal(versionedHref("tbc", "/"), "/tbc");
});

test("content-version switching preserves nested paths, queries, and hashes", () => {
  assert.equal(switchContentVersionHref("tbc", "/era/dashboard"), "/tbc/dashboard");
  assert.equal(switchContentVersionHref("era", "/tbc/profile"), "/era/profile");
  assert.equal(
    switchContentVersionHref("tbc", "/era/guilds/guild-id/raids/raid-id/prep", "?view=players", "#activity"),
    "/tbc/guilds/guild-id/raids/raid-id/prep?view=players#activity",
  );
  assert.equal(switchContentVersionHref("tbc", "/auth/signin", "?ignored=0"), "/tbc?ignored=0");
});

test("site content navigation does not rely on localStorage or alter realm ecosystems", () => {
  const header = fs.readFileSync("components/header.tsx", "utf8");
  const root = fs.readFileSync("app/page.tsx", "utf8");
  assert.doesNotMatch(header + root, /localStorage/);
  assert.doesNotMatch(fs.readFileSync("lib/navigation.ts", "utf8"), /anniversary|CharacterRealmType/);
});


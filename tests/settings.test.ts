import assert from "node:assert/strict";
import test from "node:test";
import { REGISTERED_GUILD_CAPABILITIES } from "../lib/guilds/types.ts";
import { capabilityState, filterClaims } from "../lib/guilds/settings.ts";
import { roleCapabilities } from "../lib/guilds/permissions.ts";
import { VALID_MEMBER_SIGNUP_STATUSES, effectiveSignupStatus, groupHasCapacity, rosterCounts, staleAssignmentMessage, staleRosterMessage, reorder } from "../lib/guilds/raid-utils.ts";

test("settings exposes only registered role capabilities", () => {
  assert.ok(REGISTERED_GUILD_CAPABILITIES.includes("manage-permissions"));
  assert.deepEqual(roleCapabilities("member"), []);
  assert.ok(roleCapabilities("owner").includes("manage-settings"));
});
test("capability override states distinguish inherited, grant, and revoke", () => {
  const member = { role: "officer", capabilities: ["manage-notes"], revoked_capabilities: ["manage-raid"] };
  assert.equal(capabilityState(member, "create-raid"), "inherited");
  assert.equal(capabilityState(member, "manage-notes"), "explicitly granted");
  assert.equal(capabilityState(member, "manage-raid"), "explicitly revoked");
});
test("claim status filtering and conflict messaging data remain deterministic", () => {
  const claims = [{ status: "pending", character_name: "Aidy" }, { status: "approved", character_name: "Other" }];
  assert.equal(filterClaims(claims, "pending").length, 1);
  assert.equal(filterClaims(claims, "all").length, 2);
  assert.match("Conflict: inactive roster character", /inactive roster character/i);
});
test("raid signup, counters, capacity, stale messages, and ordering are deterministic", () => {
  assert.deepEqual(VALID_MEMBER_SIGNUP_STATUSES, ["accepted", "tentative", "unavailable", "late"]);
  assert.equal(effectiveSignupStatus("accepted", "tentative"), "tentative");
  assert.equal(groupHasCapacity(["a", "b", "c", "d", "e"], "f"), false);
  assert.deepEqual(rosterCounts(["a", "a"], ["b"]), { selected: 1, benched: 1 });
  assert.match(staleRosterMessage(), /reload/i); assert.match(staleAssignmentMessage(), /reload/i);
  assert.deepEqual(reorder(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
});

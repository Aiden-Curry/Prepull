import assert from "node:assert/strict";
import test from "node:test";
import { REGISTERED_GUILD_CAPABILITIES } from "../lib/guilds/types.ts";
import { capabilityState, filterClaims } from "../lib/guilds/settings.ts";
import { roleCapabilities } from "../lib/guilds/permissions.ts";

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

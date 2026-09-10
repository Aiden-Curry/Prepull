import assert from "node:assert/strict";
import test from "node:test";
import { buildPlayerAdvice } from "../lib/player-advice/service.ts";
import { eraFuryFixtures } from "../lib/gear-analysis/fixtures.ts";
import { buildSessionPlan, sessionPlanText } from "../lib/session-planner/service.ts";
import type { PlayerAdvice } from "../lib/player-advice/types.ts";

const advice = buildPlayerAdvice(eraFuryFixtures.fresh60).advice;
const plan = (duration: any, preference: any, input = advice) => buildSessionPlan({ advice: input, synced: true, duration, preference });
test("30 minute planning prefers preparation without claiming a duration", () => { const result = plan("30m", "solo-prep"); assert.ok(result.primaryAction); assert.notEqual(result.primaryAction?.suitability, "longer-session"); assert.doesNotMatch(sessionPlanText("Aidy", result), /\d+\s*(minutes?|hours?)/i); });
test("60, 90, and 2h+ plans remain deterministic and expose a main action", () => { for (const duration of ["60m", "90m", "120m"] as const) assert.ok(plan(duration, "best-progress").primaryAction); });
test("preference modes rank their broad action categories", () => { const dungeon = plan("90m", "dungeons"); assert.equal(dungeon.primaryAction?.type, "dungeon"); const solo = plan("60m", "solo-prep"); assert.ok(["crafting", "vendor", "quest", "pvp", "other"].includes(solo.primaryAction?.type ?? "")); });
test("unsynced and unsupported characters are blocked safely", () => { const unsynced = buildSessionPlan({ advice, synced: false, duration: "90m", preference: "best-progress" }); assert.match(unsynced.limitations[0], /Refresh your character/); const unsupported: PlayerAdvice = { ...advice, supported: false }; const result = buildSessionPlan({ advice: unsupported, synced: true, duration: "90m", preference: "best-progress" }); assert.match(result.limitations[0], /isn't available/); });
test("dungeon mode does not manufacture a path near BiS", () => { const result = buildSessionPlan({ advice: buildPlayerAdvice(eraFuryFixtures.nearBis).advice, synced: true, duration: "90m", preference: "dungeons" }); assert.equal(result.primaryAction, undefined); assert.match(result.limitations[0], /strong dungeon upgrade path/); });
test("plans contain no drop rates or farming-time claims", () => { const text = sessionPlanText("Aidy", plan("120m", "raid-prep")); assert.doesNotMatch(text, /drop|farm(ing)? time|expected completion|per hour|%/i); });

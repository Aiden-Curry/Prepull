import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WarcraftLogsProvider, rankingQuery, ERA_SELECTIONS } from "../lib/warcraft-logs/provider.ts";
import { ERA_RAIDS, ERA_PARTITION } from "../lib/warcraft-logs/registry.ts";
import { WclTransportError, type GraphqlResult } from "../lib/warcraft-logs/transport.ts";
import { progression } from "../lib/warcraft-logs/model.ts";

const input = { contentVersion: "era", realmType: "era", region: "eu", realm: "firemaw", characterName: "Kankan" } as const;
// These are sanitized real responses. Variants below deliberately mutate that
// schema; they are deterministic test scenarios, not additional live evidence.
function observed() { return JSON.parse(readFileSync(new URL("./fixtures/warcraft-logs/vanilla-provider-live.json", import.meta.url), "utf8")); }
const scenarios = JSON.parse(readFileSync(new URL("./fixtures/warcraft-logs/provider-scenarios.json", import.meta.url), "utf8"));
function harness(mutate: (fixture: ReturnType<typeof observed>) => void = () => {}) {
  const fixture = observed(); mutate(fixture); let calls = 0;
  return { fixture, calls: () => calls, provider: new WarcraftLogsProvider({ query: async (site, query) => {
    assert.equal(site, "vanilla"); assert.doesNotMatch(query, /includePrivateLogs|events\(/);
    const capture = fixture.captures[calls++]; assert.ok(capture, "bounded requests");
    return { data: { characterData: { character: capture.character } }, errors: capture.errors, operationName: capture.operation, httpStatus: 200 } as GraphqlResult;
  } }) };
}
test("Era explicitly isolates standard zones and validated S0 from Discovery and other partitions", () => {
  assert.deepEqual(ERA_RAIDS.map(r => r.id).sort(), [2000,2001,2002,2003,2004,2005,2006]);
  const query = rankingQuery(ERA_SELECTIONS);
  assert.equal((query.match(/zoneRankings\(/g) ?? []).length, 21);
  assert.doesNotMatch(query, /zoneID:20(?:0[7-9]|1\d)/);
  assert.equal(ERA_PARTITION.id, 1);
  for (const zone of ERA_RAIDS) { assert.deepEqual(zone.partitions.filter(p => p.default).map(p => [p.id,p.name]), [[1,"S0"]]); assert.ok(zone.encounters.every(e => typeof e.progression === "boolean")); }
  assert.deepEqual([...new Set([...query.matchAll(/partition:(\d+)/g)].map(m => m[1]))], ["1"]);
  assert.equal(ERA_RAIDS.find(r => r.id === 2002)!.encounters.filter(e => e.progression).length, 8);
});
test("real seven-raid fixture preserves provider averages, explicit per-spec kills, public reports and three-call bound", async () => {
  const h = harness(); const result = await h.provider.lookup(input);
  assert.equal(h.calls(), 3); assert.equal(result.fixture, false); assert.equal(result.status, "available"); assert.equal(result.raids.length, 7);
  const mc = result.raids.find(r => r.zoneId === 2000)!;
  assert.equal(progression(mc).total, 10); assert.equal(progression(mc).killed, 10);
  const dps = mc.aggregates.find(a => a.label === "Best Performance Avg" && a.role === "DPS")!;
  assert.equal(dps.value, h.fixture.captures[2].character.z2000DPSs0.bestPerformanceAverage);
  const patchwerk = result.raids.find(r => r.zoneId === 2006)!.bosses.find(b => b.encounterId === 51118)!;
  assert.deepEqual(patchwerk.performances.map(p => [p.spec,p.role,p.kills]), [["Fury","DPS",96],["Protection","Tank",36]]);
  assert.equal(result.reports.length, 5); assert.doesNotMatch(JSON.stringify(result), /canonicalID|rank_id|reportID|visibility/);
});
test("Fresh pending support makes zero provider calls", async () => {
  const h=harness(); assert.equal((await h.provider.lookup({...input,contentVersion:"tbc",realmType:"anniversary"})).status,"unsupported"); assert.equal(h.calls(),0);
});
test("not found and hidden do not fetch rankings", async () => {
  for (const [character,status] of [[scenarios.notFound.data.characterData.character,"not-found"],[scenarios.hidden.data.characterData.character,"hidden"]] as const) {
    const h=harness(f=>{f.captures[0].character=character;}); assert.equal((await h.provider.lookup(input)).status,status); assert.equal(h.calls(),1);
  }
});
test("empty real-shaped rankings are no public data, not a provider failure", async () => {
  const h=harness(f=>{f.captures[0].character.recentReports.data=[]; for(const s of ERA_SELECTIONS) Object.assign(f.captures[1].character[s.alias],{rankings:[],allStars:[],bestPerformanceAverage:null,medianPerformanceAverage:null});});
  assert.equal((await h.provider.lookup(input)).status,"no-public-logs");
});
test("partial progression uses totalKills, never percentile or report count", async () => {
  const h=harness(f=>{for(const capture of f.captures.slice(1)) for(const [alias,value] of Object.entries(capture.character)) if(alias.startsWith("z2000")) for(const row of (value as {rankings:{totalKills:number}[]}).rankings.slice(6)) row.totalKills=0;});
  const mc=(await h.provider.lookup(input)).raids.find(r=>r.zoneId===2000)!; assert.deepEqual(progression(mc),{killed:6,total:10,cleared:false});
});
test("partial GraphQL errors retain successful raids and mark only the failed raid", async () => {
  const h=harness(f=>{f.captures[1].errors=scenarios.partialGraphqlError.errors;});
  const result=await h.provider.lookup(input);assert.equal(result.raids.find(r=>r.zoneId===2000)!.status,"temporary-error");assert.equal(result.raids.find(r=>r.zoneId===2006)!.status,"available");
});
test("wrong partition or Discovery payload cannot enter Era progression", async () => {
  for(const patch of [{partition:2},{partition:3},{partition:7},{partition:8},{zone:2012}]) {
    const h=harness(f=>{for(const s of ERA_SELECTIONS.filter(s=>s.zone===2000)) Object.assign(f.captures[1].character[s.alias],patch);});
    const mc=(await h.provider.lookup(input)).raids.find(r=>r.zoneId===2000)!;assert.equal(mc.status,"temporary-error");assert.equal(progression(mc).killed,0);
  }
});
test("non-public and unknown visibility reports never receive links", async () => {
  const h=harness(f=>{for(const r of f.captures[0].character.recentReports.data) r.visibility="private";});assert.deepEqual((await h.provider.lookup(input)).reports,[]);
});
test("healer variant uses observed HPS schema without inventing DPS", async () => {
  const h=harness(f=>{const c=f.captures[1].character; const source=scenarios.healer;
    // Fresh observed Holy row, explicitly transplanted into an Era test scenario.
    const row=source.rankings.find((r:{totalKills:number})=>r.totalKills>0);
    c.z2000Healer={...c.z2000Healer,allStars:[{spec:"Holy",partition:1}],rankings:[{...row,encounter:{id:50663,name:"Lucifron"}}]};
    f.captures[2].character.z2000Healers0=c.z2000Healer;
  });const mc=(await h.provider.lookup(input)).raids.find(r=>r.zoneId===2000)!;assert.ok(mc.bosses[0].performances.some(p=>p.spec==="Holy"&&p.role==="Healer"&&p.metric==="HPS"&&p.kills===1));
});
test("multiple specs within the same role are explicitly filtered, never assigned all-spec totals", async () => {
  const h=harness(f=>{
    const base=f.captures[1].character.z2000DPS;
    base.allStars.push({spec:"Arms",partition:1});
    const fury=f.captures[2].character.z2000DPSs0;
    const arms=structuredClone(fury); arms.allStars=[{spec:"Arms",partition:1}];
    for(const row of arms.rankings) Object.assign(row,{spec:"Arms",bestSpec:"Arms",totalKills:2});
    f.captures[2].character.z2000DPSs1=arms;
  });
  const mc=(await h.provider.lookup(input)).raids.find(r=>r.zoneId===2000)!;
  assert.equal(h.calls(),3);
  assert.ok(mc.bosses[0].performances.some(p=>p.spec==="Arms"&&p.role==="DPS"&&p.kills===2));
  assert.ok(mc.bosses[0].performances.some(p=>p.spec==="Fury"&&p.kills!==2));
});
test("rate limit and upstream errors retain safe transport classification", async () => {
  for(const kind of ["rate-limit","upstream"] as const) {const p=new WarcraftLogsProvider({query:async()=>{throw new WclTransportError(kind,30);}});await assert.rejects(p.lookup(input),(e:unknown)=>e instanceof WclTransportError&&e.kind===kind);}
});

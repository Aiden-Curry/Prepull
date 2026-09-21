import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { guideRegistry, guideHref, publishedGuides, resolveGuide, bossGuide, raidGuide, specGuide, moltenCoreEncounters, publicGuidePaths } from "../lib/guides/registry.ts";
import { guideContent } from "../lib/guides/content.ts";
import { resolveGuideGear } from "../lib/guides/gear.ts";
import { validateGuides } from "../lib/guides/validate.ts";
import { wowheadLink } from "../lib/armory/wowhead.ts";
import { siteOrigin } from "../lib/guides/metadata.ts";
import type { Guide, GuideContent } from "../lib/guides/types.ts";

test("published guide manifest resolves routes and all ten accepted encounters in order", () => {
  assert.deepEqual(validateGuides(), []);
  assert.equal(publishedGuides().length, 14);
  for (const guide of publishedGuides()) assert.equal(resolveGuide(guide.contentVersion, guide.slug)?.id, guide.id);
  const bosses = publishedGuides("era").filter(guide => guide.type === "boss");
  assert.deepEqual(bosses.map(guide => guide.encounterId), moltenCoreEncounters.map(boss => boss.id));
  assert.deepEqual(bosses.map(guide => guide.title), moltenCoreEncounters.map(boss => boss.name));
  assert.equal(bossGuide("era", 2000, 50672)?.title, "Ragnaros");
  assert.equal(bossGuide("era", 2012, 50672), undefined);
  assert.equal(raidGuide("era", 2000)?.title, "Molten Core");
  assert.equal(new Set(publicGuidePaths()).size, publicGuidePaths().length);
});
test("no draft, unsupported spec or cross-version fallback", () => {
  const draft: Guide = { ...guideRegistry[0], status: "draft" };
  assert.deepEqual(publishedGuides(undefined, [draft]), []);
  assert.equal(resolveGuide("era", draft.slug, [draft]), undefined);
  assert.equal(resolveGuide("tbc", guideRegistry[0].slug), undefined);
  assert.equal(specGuide("era", "Warrior", "Arms"), undefined);
  assert.equal(specGuide("era", "Warrior", "Protection"), undefined);
  assert.equal(specGuide("tbc", "Warrior", "Fury"), undefined);
  assert.equal(specGuide("era", " warrior ", "fury")?.id, "era-fury");
  assert.equal(bossGuide("tbc", 2000, 50672), undefined);
  assert.equal(publicGuidePaths().some(path => path.startsWith("/tbc/guides/raids/")), false);
  assert.ok(validateGuides([draft], guideContent, [draft]).some(error => error.includes("leaked")));
});
test("Fury gear resolves both published central sets without modifying them", () => {
  const first = resolveGuideGear("era-warrior-fury", [0, 1]); const snapshot = JSON.stringify(first);
  assert.equal(first[0].set.id, "era-fury-pre-raid"); assert.equal(first[1].set.id, "era-fury-phase-1");
  assert.ok(first[0].slots.flatMap(slot => slot.items).some(({ item }) => item.itemId === 22385));
  assert.ok(!first[1].slots.flatMap(slot => slot.items).some(({ item }) => item.itemId === 22385));
  assert.equal(first[1].slots.flatMap(slot => slot.items).find(({ item }) => item.itemId === 11815)?.reference.source.boss, "General Angerforge");
  for (const phase of first) for (const slot of phase.slots) for (const { item, reference } of slot.items) assert.equal(item.itemId, reference.itemId);
  assert.equal(JSON.stringify(resolveGuideGear("era-warrior-fury", [0, 1])), snapshot);
  assert.throws(() => resolveGuideGear("unknown", [0]));
  assert.throws(() => resolveGuideGear("era-warrior-fury", [6]));
});
test("validator rejects broken metadata, identity, anchors, links, sources and references", () => {
  const mutate = (change: (entries: Guide[], content: Record<string, GuideContent>) => void, expected: RegExp) => {
    const entries = structuredClone(guideRegistry) as Guide[]; const content = structuredClone(guideContent);
    change(entries, content); assert.ok(validateGuides(entries, content).some(error => expected.test(error)), String(expected));
  };
  mutate(entries => entries.push(entries[0]), /duplicate guide ID/);
  mutate(entries => entries.push({ ...entries[0], id: "another" }), /duplicate slug/);
  mutate(entries => { entries[0].contentVersion = "retail" as "era"; }, /invalid content version/);
  mutate(entries => { entries[0].title = ""; entries[0].updatedAt = "bad"; }, /review date/);
  mutate(entries => { const boss = entries.find(entry => entry.type === "boss")!; if (boss.type === "boss") boss.raidId = 2001; }, /wrong raid/);
  mutate(entries => { entries.pop(); }, /coverage/);
  mutate((_, content) => { content["era-fury"].sections.push(content["era-fury"].sections[0]); }, /anchor/);
  mutate((_, content) => { content["era-fury"].sections[0].blocks.push({ kind: "links", guideIds: ["missing"] }); }, /broken internal/);
  mutate((_, content) => { content["era-fury"].sources = []; }, /missing sources/);
  mutate((_, content) => { content["era-fury"].sources[0].url = "javascript:alert(1)"; }, /source metadata/);
  mutate((_, content) => { content["era-fury"].sections[0].blocks.push({ kind: "wowhead", entries: [{ type: "item", id: -1, name: "invalid", note: "" }] }); }, /Wowhead/);
  mutate((_, content) => { content["era-fury"].sections[0].blocks.push({ kind: "gear", specKey: "missing", phases: [0] }); }, /recommendation/);
});
test("internal links and anchors are published and share the existing Wowhead helper", () => {
  for (const guide of publishedGuides()) {
    assert.match(guideHref(guide), /^\/era\/guides\//);
    for (const section of guideContent[guide.id].sections) for (const block of section.blocks) {
      if (block.kind === "links") for (const id of block.guideIds) assert.ok(publishedGuides().some(entry => entry.id === id));
      if (block.kind === "wowhead") for (const entry of block.entries) assert.match(wowheadLink("era", "era", entry.type, entry.id)!, /^https:\/\/www.wowhead.com\/classic\//);
    }
  }
  const renderer = readFileSync("components/guides/guide-page.tsx", "utf8");
  assert.match(renderer, /lib\/armory\/wowhead/); assert.equal((renderer.match(/<WowheadTooltips /g) ?? []).length, 1);
  assert.doesNotMatch(renderer, /getServerSession|dangerouslySetInnerHTML|fetch\(/);
});
test("canonical origin is explicit and does not infer a preview host", () => {
  assert.equal(siteOrigin({ PREPULL_SITE_URL: "https://public.example", NEXTAUTH_URL: "https://staging.example" }), "https://public.example");
  assert.equal(siteOrigin({ VERCEL_URL: "preview.example" }), "http://localhost:3000");
  assert.throws(() => siteOrigin({ PREPULL_SITE_URL: "https://user:password@example.com" }));
});

test("Frost uses accepted gear and exact specialization without TBC fallback", () => {
  assert.equal(specGuide("era", "Mage", "Frost")?.id, "era-frost");
  for (const spec of ["Fire", "Arcane", "Unavailable"]) assert.equal(specGuide("era", "Mage", spec), undefined);
  assert.equal(specGuide("tbc", "Mage", "Frost"), undefined);
  assert.equal(resolveGuide("tbc", "classes/mage/frost"), undefined);
  const sets = resolveGuideGear("era-mage-frost", [0, 1]);
  assert.deepEqual(sets.map(({ set }) => set.id), ["era-frost-mage-pre-raid", "era-frost-mage-phase-1"]);
  for (const { set, slots } of sets) for (const { slot, items } of slots) {
    assert.ok(items.length > 0);
    for (const { item, reference } of items) assert.ok(set.slots[slot as keyof typeof set.slots]?.some(entry => entry.itemId === item.itemId && entry.itemId === reference.itemId));
  }
  const content = structuredClone(guideContent);
  content["era-frost"].sections = content["era-frost"].sections.filter(section => section.id !== "gear");
  assert.ok(validateGuides(guideRegistry, content).some(error => /Frost Mage must reference Pre-Raid and Phase 1 gear/.test(error)));
});

test("Combat uses exact specialization and accepted gear phases without TBC fallback", () => {
  assert.equal(specGuide("era", "Rogue", "Combat")?.id, "era-combat");
  for (const spec of ["Assassination", "Subtlety", "Unavailable"]) assert.equal(specGuide("era", "Rogue", spec), undefined);
  assert.equal(specGuide("tbc", "Rogue", "Combat"), undefined);
  assert.equal(resolveGuide("tbc", "classes/rogue/combat"), undefined);
  const sets = resolveGuideGear("era-rogue-combat", [0, 1]);
  assert.deepEqual(sets.map(({ set }) => set.id), ["era-combat-rogue-pre-raid", "era-combat-rogue-phase-1"]);
  for (const { set, slots } of sets) for (const { slot, items } of slots) {
    assert.ok(items.length > 0);
    for (const { item, reference } of items) assert.ok(set.slots[slot as keyof typeof set.slots]?.some(entry => entry.itemId === item.itemId && entry.itemId === reference.itemId));
  }
  for (const phases of [[0], [1]]) {
    const contents = structuredClone(guideContent);
    const gear = contents["era-combat"].sections.flatMap(section => section.blocks).find(block => block.kind === "gear")!;
    if (gear.kind === "gear") gear.phases = phases;
    assert.ok(validateGuides(guideRegistry, contents).some(error => /Combat Rogue must reference Pre-Raid and Phase 1 gear/.test(error)));
  }
});

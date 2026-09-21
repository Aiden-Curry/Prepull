import { ERA_RAIDS } from "../warcraft-logs/registry.ts";
import { guideContent } from "./content.ts";
import { resolveGuideGear } from "./gear.ts";
import { guideRegistry, publishedGuides } from "./registry.ts";
import type { Guide, GuideContent } from "./types.ts";
import { guideTalentBuild, validateTalentBuild } from "../talents/registry.ts";

const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value;
const safeUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } };
export function validateGuides(entries: readonly Guide[] = guideRegistry, contents: Readonly<Record<string, GuideContent>> = guideContent, publicEntries: readonly Guide[] = publishedGuides(undefined, entries)): string[] {
  const errors: string[] = []; const ids = new Set<string>(); const slugs = new Set<string>();
  for (const guide of entries) {
    const fail = (message: string) => errors.push(`${guide.id}: ${message}`);
    if (ids.has(guide.id)) fail("duplicate guide ID"); ids.add(guide.id);
    const path = `${guide.contentVersion}/${guide.slug}`;
    if (slugs.has(path)) fail("duplicate slug"); slugs.add(path);
    if (!["era", "tbc"].includes(guide.contentVersion)) fail("invalid content version");
    if (!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(guide.slug)) fail("invalid slug");
    if (!["published", "draft", "unavailable"].includes(guide.status)) fail("invalid status");
    if (guide.type !== "spec") {
      const raid = guide.contentVersion === "era" ? ERA_RAIDS.find(raid => raid.id === guide.raidId) : undefined;
      if (!raid) fail("unknown raid for content version");
      if (guide.type === "boss" && !raid?.encounters.some(boss => boss.id === guide.encounterId && boss.progression)) fail("unknown progression encounter or wrong raid");
    }
    if (guide.status !== "published") continue;
    if (!guide.title.trim()) fail("missing title");
    try { if (!date(guide.updatedAt)) fail("missing or invalid review date"); } catch { fail("invalid review date"); }
    const content = contents[guide.id];
    if (!content) { fail("missing published content"); continue; }
    if (!content.summary.trim() || !content.sections.length) fail("missing summary or sections");
    if (!content.sources.length) fail("missing sources");
    for (const source of content.sources) {
      try { if (!source.title.trim() || !source.publisher.trim() || !safeUrl(source.url) || !date(source.accessedAt)) fail("invalid source metadata"); } catch { fail("invalid source metadata"); }
    }
    const anchors = new Set(["sources", "quick-summary"]);
    for (const section of content.sections) {
      if (!/^[a-z][a-z0-9-]*$/.test(section.id) || anchors.has(section.id) || anchors.has(`${section.id}-heading`)) fail("duplicate or invalid section anchor");
      anchors.add(section.id); anchors.add(`${section.id}-heading`);
      if (!section.title.trim() || !section.blocks.length) fail("empty section");
      for (const block of section.blocks) {
        if (block.kind === "talent-build") {
          for (const id of [block.buildId, ...(block.alternativeBuildIds ?? [])]) {
          const data = guideTalentBuild(id);
          if (!data || guide.type !== "spec" || data.metadata.className !== guide.className || guide.contentVersion !== data.metadata.contentVersion) fail("invalid guide talent build identity");
          else for (const error of validateTalentBuild(data.metadata, data.build)) fail(error);
          }
        }
        if (block.kind === "links") for (const id of block.guideIds) if (!entries.some(target => target.id === id && target.status === "published" && target.contentVersion === guide.contentVersion)) fail(`broken internal guide link: ${id}`);
        if (block.kind === "wowhead") for (const entry of block.entries) if (!["item", "spell"].includes(entry.type) || !Number.isSafeInteger(entry.id) || entry.id <= 0 || !entry.name.trim()) fail("invalid Wowhead reference");
        if (block.kind === "gear") {
          try {
            const sets = resolveGuideGear(block.specKey, block.phases);
            if (guide.type !== "spec" || sets.some(({ set }) => set.contentVersion !== guide.contentVersion || set.className !== guide.className || set.specialization !== guide.specName)) fail("gear identity mismatch");
          } catch { fail("unknown recommendation reference"); }
        }
        if (block.kind === "bosses" && (guide.type !== "raid" || block.raidId !== guide.raidId)) fail("boss list linked to wrong raid");
      }
    }
    if (guide.type === "boss" && (!content.quick || ["mechanics", "positioning", "tank", "healer", "dps", "preparation", "fury"].some(id => !anchors.has(id)))) fail("incomplete boss template");
    const requiredGear = guide.id === "era-fury" ? "era-warrior-fury" : guide.id === "era-frost" ? "era-mage-frost" : guide.id === "era-combat" ? "era-rogue-combat" : undefined;
    if (requiredGear && !content.sections.some(section => section.blocks.some(block => block.kind === "gear" && block.specKey === requiredGear && [0, 1].every(phase => block.phases.includes(phase))))) fail(`${guide.title} must reference Pre-Raid and Phase 1 gear`);
  }
  for (const guide of publicEntries) if (guide.status !== "published" || !entries.some(entry => entry.id === guide.id && entry.status === "published")) errors.push(`${guide.id}: draft or unknown guide leaked into public manifest`);
  for (const raid of entries.filter(entry => entry.status === "published" && entry.type === "raid")) {
    if (raid.type !== "raid") continue;
    const expected = raid.contentVersion === "era" ? ERA_RAIDS.find(entry => entry.id === raid.raidId)?.encounters.filter(boss => boss.progression) ?? [] : [];
    const bosses = entries.filter(entry => entry.type === "boss" && entry.status === "published" && entry.contentVersion === raid.contentVersion && entry.raidId === raid.raidId);
    for (const encounter of expected) if (bosses.filter(boss => boss.type === "boss" && boss.encounterId === encounter.id).length !== 1) errors.push(`${raid.id}: missing or duplicate boss coverage for ${encounter.id}`);
    if (bosses.length !== expected.length) errors.push(`${raid.id}: progression coverage count mismatch`);
  }
  return errors;
}

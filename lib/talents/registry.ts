import { warriorTalents } from "./warrior.ts";
import { furyGuideBuild } from "./builds.ts";
import { mageTalents } from "./mage.ts";
import { frostGuideBuilds } from "./mage-builds.ts";
import { rogueTalents } from "./rogue.ts";
import { combatGuideBuilds } from "./rogue-builds.ts";
import { hunterTalents } from "./hunter.ts";
import { marksmanshipGuideBuilds } from "./hunter-builds.ts";
import type { ClassicTalentClass, GuideTalentBuild } from "./types.ts";

export function guideTalentBuild(id: string) {
  if (id === furyGuideBuild.id) return { metadata: warriorTalents, build: furyGuideBuild };
  const build = frostGuideBuilds.find(build => build.id === id);
  if (build) return { metadata: mageTalents, build };
  const combat = combatGuideBuilds.find(build => build.id === id);
  if (combat) return { metadata: rogueTalents, build: combat };
  const hunter = marksmanshipGuideBuilds.find(build => build.id === id);
  return hunter ? { metadata: hunterTalents, build: hunter } : undefined;
}
export function talentAllocation(metadata: ClassicTalentClass, build: GuideTalentBuild) {
  return metadata.trees.map(tree => metadata.talents.filter(t => t.tree === tree.id).reduce((sum, t) => sum + (build.selectedRanks[t.id] ?? 0), 0));
}
export function validateTalentBuild(metadata: ClassicTalentClass, build: GuideTalentBuild): string[] {
  const errors: string[] = [];
  const byId = new Map(metadata.talents.map(t => [t.id, t]));
  const positions = new Set<string>();
  if (byId.size !== metadata.talents.length) errors.push("Duplicate talent ID");
  if (build.classId !== metadata.id) errors.push("Build class mismatch");
  for (const id of Object.keys(build.selectedRanks)) if (!byId.has(id)) errors.push(`Unknown selected talent: ${id}`);
  for (const t of metadata.talents) {
    const rank = build.selectedRanks[t.id] ?? 0;
    const position = `${t.tree}:${t.row}:${t.column}`;
    if (positions.has(position)) errors.push(`Duplicate position: ${t.id}`); positions.add(position);
    if (!metadata.trees.some(tree => tree.id === t.tree) || !Number.isInteger(t.row) || t.row < 1 || t.row > 7 || !Number.isInteger(t.column) || t.column < 1 || t.column > 4) errors.push(`Invalid position: ${t.id}`);
    if (!Number.isInteger(t.maxRank) || t.maxRank < 1 || t.spellIds.length !== t.maxRank || t.spellIds.some(id => !Number.isSafeInteger(id) || id <= 0) || !/^[a-z0-9_]+$/.test(t.icon)) errors.push(`Invalid spell metadata: ${t.id}`);
    if (!Number.isInteger(rank) || rank < 0 || rank > t.maxRank) errors.push(`Invalid selected rank: ${t.id}`);
    const prerequisite = t.prerequisite ? byId.get(t.prerequisite) : undefined;
    if (t.prerequisite && (!prerequisite || prerequisite.tree !== t.tree || prerequisite.row >= t.row)) errors.push(`Invalid prerequisite: ${t.id}`);
    if (rank > 0) {
      const earlier = metadata.talents.filter(other => other.tree === t.tree && other.row < t.row).reduce((sum, other) => sum + (build.selectedRanks[other.id] ?? 0), 0);
      if (earlier < (t.row - 1) * 5) errors.push(`Locked row: ${t.id}`);
      if (prerequisite && (build.selectedRanks[prerequisite.id] ?? 0) !== prerequisite.maxRank) errors.push(`Unfilled prerequisite: ${t.id}`);
    }
  }
  const allocation = talentAllocation(metadata, build);
  if (allocation.reduce((a, b) => a + b, 0) !== 51 || allocation.join("/") !== build.expectedAllocation.join("/")) errors.push("Invalid level-60 allocation");
  return errors;
}

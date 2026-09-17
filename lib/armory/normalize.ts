import type { CharacterStatistics, CharacterTalentState, Statistic } from "./types.ts";

const record = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const fields = [
  ["health", "Health", ""], ["power", "Power", ""], ["strength", "Strength", "effective"], ["agility", "Agility", "effective"],
  ["stamina", "Stamina", "effective"], ["intellect", "Intellect", "effective"], ["spirit", "Spirit", "effective"],
  ["armor", "Armor", "effective"], ["attack_power", "Attack power", ""], ["ranged_attack_power", "Ranged attack power", ""],
  ["spell_power", "Spell power", ""], ["healing", "Healing", ""], ["melee_crit", "Melee crit", "value"],
  ["ranged_crit", "Ranged crit", "value"], ["spell_crit", "Spell crit", "value"], ["melee_hit", "Melee hit", "value"],
  ["ranged_hit", "Ranged hit", "value"], ["spell_hit", "Spell hit", "value"], ["defense", "Defense", "effective"],
  ["dodge", "Dodge", "value"], ["parry", "Parry", "value"], ["block", "Block", "value"],
] as const;

export function normalizeStatistics(payload: unknown, retrievedAt: string): CharacterStatistics {
  const data = record(payload); const values: Statistic[] = [];
  for (const [key, label, nested] of fields) {
    const value = nested ? record(data[key])[nested] : data[key];
    if (finite(value)) values.push({ key, label: key === "power" && typeof data.power_type?.name === "string" ? data.power_type.name : label, value, ...(nested === "value" ? { unit: "%" as const } : {}) });
  }
  return values.length ? { status: "available", source: "blizzard", retrievedAt, values } : { status: "unavailable", reason: "not-provided" };
}
export function relevantStatistics(values: Statistic[], className: string) {
  const physical = ["Warrior", "Rogue", "Hunter"].includes(className);
  return values.filter(({ key, value }) => {
    if (["health", "stamina", "armor"].includes(key)) return true;
    if (physical && ["intellect", "spirit", "spell_power", "healing", "spell_crit", "spell_hit"].includes(key)) return false;
    if (!physical && ["attack_power", "ranged_attack_power", "melee_hit", "ranged_hit", "ranged_crit"].includes(key)) return false;
    return value > 0;
  });
}

// Only explicit active Classic selections are accepted. A spec name is not a build.
export function normalizeTalentState(payload: unknown, retrievedAt: string): CharacterTalentState {
  const groups = record(payload).specialization_groups;
  const active = Array.isArray(groups) ? groups.find((group) => group?.is_active === true) : undefined;
  if (!Array.isArray(active?.specializations)) return { status: "unavailable", reason: "not-provided" };
  const trees = active.specializations.flatMap((raw: unknown) => {
    const tree = record(raw);
    if (typeof tree.specialization_name !== "string" || !Array.isArray(tree.talents)) return [];
    const selections = tree.talents.flatMap((rawTalent: unknown) => {
      const selection = record(rawTalent); const talent = record(selection.talent);
      const spell = record(record(selection.spell_tooltip).spell);
      const name = spell.name ?? talent.name, rank = selection.talent_rank ?? selection.rank;
      if (typeof name !== "string" || !Number.isInteger(rank) || rank <= 0) return [];
      return [{ name: name.slice(0, 160), rank, ...(Number.isSafeInteger(spell.id) && spell.id > 0 ? { spellId: spell.id } : {}) }];
    });
    // Without selections, a specialization label alone cannot establish a build.
    if (!selections.length && tree.spent_points !== 0) return [];
    return [{ name: tree.specialization_name.slice(0, 80), points: selections.reduce((sum: number, talent: { rank: number }) => sum + talent.rank, 0), selections }];
  });
  return trees.length ? { status: "available", source: "blizzard", retrievedAt, trees } : { status: "unavailable", reason: "not-provided" };
}

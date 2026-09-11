import type { SpecRuleModule } from "../manifest.ts";

const weaponSlots = new Set(["Main Hand", "Off Hand / Shield"]);

export const rogueCombatRules: SpecRuleModule = {
  id: "rogue-combat-weapon-roles-v1",
  validate(candidates) {
    const issues: string[] = [];
    for (const item of candidates.filter((candidate) => weaponSlots.has(candidate.slot))) {
      if (!item.weaponRole) issues.push(`Rogue weapon #${item.itemId} is missing an authored weapon role.`);
      else if (item.weaponRole.hand !== "one-hand") issues.push(`Rogue weapon #${item.itemId} must be one-handed.`);
      else if (!item.weaponRole.allowedSlots.includes(item.slot as "Main Hand" | "Off Hand / Shield")) issues.push(`Rogue weapon #${item.itemId} is not legal in its authored slot.`);
    }
    return issues;
  },
};

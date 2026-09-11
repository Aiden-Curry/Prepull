import type { SpecRuleModule } from "../manifest.ts";

export const hunterMarksmanshipRules: SpecRuleModule = {
  id: "hunter-ranged-melee-role-v1",
  validate(candidates) {
    const issues: string[] = [];
    for (const item of candidates) {
      if (item.slot === "Ranged / Relic" && item.weaponRole?.role !== "ranged") issues.push(`Hunter ranged item #${item.itemId} is missing the ranged role.`);
      if (["Main Hand", "Off Hand / Shield"].includes(item.slot) && item.weaponRole?.role !== "melee-stat-stick") issues.push(`Hunter melee item #${item.itemId} is missing the melee stat-stick role.`);
    }
    return issues;
  },
};

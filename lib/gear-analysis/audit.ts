import { eraFuryWarriorProfile } from "./profiles.ts";

export function auditFuryProfile() {
  return {
    profileVersion: eraFuryWarriorProfile.id,
    assumptions: eraFuryWarriorProfile.assumptionSources,
    hitTarget: eraFuryWarriorProfile.hitBreakpoint,
    statWeights: eraFuryWarriorProfile.statWeights,
    weapon: eraFuryWarriorProfile.weaponRule,
    setBonuses: eraFuryWarriorProfile.setBonuses,
    specialEffects: eraFuryWarriorProfile.specialEffects,
    enchantTreatment: "Current enchant names are retained; candidate items are evaluated unenchanted.",
    worldBuffs: "Excluded.",
    upgradeTiers: eraFuryWarriorProfile.tierThresholds,
    acquisition: eraFuryWarriorProfile.activityWeights,
  };
}

import type { SpecScoringProfile } from "./types.ts";

// PrePull curated assumptions, not a universal simulation result. The initial
// weights are intentionally easy to replace as Era theorycrafting improves.
// They prioritize a Fury Warrior's physical damage profile and value Hit more
// strongly until the configured 9% target is reached.
export const eraFuryWarriorProfile: SpecScoringProfile = {
  // v2 records the validated weapon-hand weighting, dual-slot evaluation,
  // provenance metadata, and activity-ranking semantics added in Phase 4.5.
  id: "era-fury-warrior-v2",
  className: "Warrior",
  specialization: "Fury",
  contentVersion: "era",
  strategy: "loadout-aware",
  currentPhase: 6,
  hitBreakpoint: { stat: "Hit", target: 9, belowWeight: 18, atOrAboveWeight: 4, label: "configured Fury Hit target" },
  statWeights: { Strength: 2.2, Agility: 1.4, "Attack power": 1, Crit: 9, Stamina: 0.05 },
  weaponRule: { allowedHands: ["Main Hand", "Off Hand / Shield"], oneHandOnly: true, dpsWeight: 13, speedWeight: 1.5, mainHandWeight: 1, offHandWeight: 0.85, weaponSkillNote: "Weapon skill and racial bonuses are represented as context metadata, but are not yet numerically simulated; uncertain weapon comparisons are therefore capped at Medium confidence." },
  setBonuses: [{ setId: "fury-tier1", pieces: 2, label: "Fury set 2-piece", value: 35 }, { setId: "fury-tier1", pieces: 4, label: "Fury set 4-piece", value: 75 }],
  specialEffects: { "curated-crusher": { id: "curated-crusher", type: "Proc", label: "Curated physical-damage proc", effectiveStats: { "Attack power": 35 }, confidence: "Medium" } },
  tierThresholds: { minor: 12, meaningful: 30, major: 70, bestInSlot: 100 },
  activityWeights: { major: 55, meaningful: 25, minor: 5, bestInSlot: 40, dungeonAccess: 25, raidAccess: 8, questAccess: 30, uniqueSlotBonus: 4 },
  assumptions: ["Hit target is configured at 9% for this first Fury profile; weapon skill, race, talents, and encounter context can change the appropriate target.", "Stats are weighted heuristically; this is not a DPS simulator.", "Current enchant names are retained, but no recommended replacement enchant is assumed.", "World buffs are excluded.", "Only curated special effects contribute; unknown effects are Limited confidence.", "Content phase is capped at Era phase 6."],
  assumptionSources: [
    { key: "hit-target", label: "Hit target", value: 9, source: { label: "PrePull Fury v1 target assumption", type: "internal-heuristic", notes: "Configurable starting point, not a universal Classic cap; contextual weapon skill and encounter assumptions are not yet simulated.", verifiedAt: "2026-08-11" } },
    { key: "strength", label: "Strength weight", value: 2.2, source: { label: "PrePull curated stat heuristic", type: "internal-heuristic", notes: "Used for relative ranking only; no DPS percentage is claimed.", verifiedAt: "2026-08-11" } },
    { key: "agility", label: "Agility weight", value: 1.4, source: { label: "PrePull curated stat heuristic", type: "internal-heuristic", notes: "Used for relative ranking only.", verifiedAt: "2026-08-11" } },
    { key: "attack-power", label: "Attack Power weight", value: 1, source: { label: "PrePull curated stat heuristic", type: "internal-heuristic", notes: "Baseline comparison unit.", verifiedAt: "2026-08-11" } },
    { key: "crit", label: "Crit weight", value: 9, source: { label: "PrePull curated stat heuristic", type: "internal-heuristic", notes: "Used for relative ranking only.", verifiedAt: "2026-08-11" } },
    { key: "hit-below", label: "Hit below target", value: 18, source: { label: "Configured breakpoint heuristic", type: "internal-heuristic", notes: "Higher marginal value until the configured target.", verifiedAt: "2026-08-11" } },
    { key: "hit-above", label: "Hit above target", value: 4, source: { label: "Configured breakpoint heuristic", type: "internal-heuristic", notes: "Reduced marginal value above the configured target.", verifiedAt: "2026-08-11" } },
    { key: "weapon-dps", label: "Weapon DPS weight", value: 13, source: { label: "Weapon ranking heuristic", type: "internal-heuristic", notes: "Not a combat simulation; speed and hand context remain explicit limitations.", verifiedAt: "2026-08-11" } },
    { key: "weapon-speed", label: "Weapon speed weight", value: 1.5, source: { label: "Weapon ranking heuristic", type: "internal-heuristic", notes: "Speed is retained because Fury weapon comparisons cannot treat it as irrelevant.", verifiedAt: "2026-08-11" } },
    { key: "main-hand", label: "Main-hand weighting", value: 1, source: { label: "Weapon hand heuristic", type: "internal-heuristic", notes: "Main hand is the baseline weapon contribution in this non-simulation profile.", verifiedAt: "2026-08-11" } },
    { key: "off-hand", label: "Off-hand weighting", value: 0.85, source: { label: "Weapon hand heuristic", type: "internal-heuristic", notes: "Off hand is reduced relative to main hand; this is not a full Fury combat model.", verifiedAt: "2026-08-11" } },
    { key: "set-bonuses", label: "Set bonus values", value: "35 / 75", source: { label: "Curated test-profile values", type: "curated", notes: "Architecture fixture values pending authoritative profile data.", verifiedAt: "2026-08-11" } },
    { key: "special-effects", label: "Special effects", value: "curated only", source: { label: "Curated effect model", type: "curated", notes: "Unknown proc/on-use effects are Limited confidence.", verifiedAt: "2026-08-11" } },
    { key: "enchants", label: "Enchant treatment", value: "candidate unenchanted", source: { label: "PrePull comparison rule", type: "internal-heuristic", notes: "Avoids silently assuming an expensive replacement enchant.", verifiedAt: "2026-08-11" } },
    { key: "world-buffs", label: "World buffs", value: "excluded", source: { label: "Scope decision", type: "internal-heuristic", notes: "World buffs are not part of this gear-only comparison.", verifiedAt: "2026-08-11" } },
    { key: "tier-thresholds", label: "Upgrade thresholds", value: "12 / 30 / 70 / 100", source: { label: "PrePull tier heuristic", type: "internal-heuristic", notes: "Sidegrade, Minor, Meaningful, Major, and BestInSlot thresholds.", verifiedAt: "2026-08-11" } },
    { key: "activity-weights", label: "Activity weights", value: "configured", source: { label: "PrePull acquisition heuristic", type: "internal-heuristic", notes: "Rewards major/meaningful/BiS outcomes and accessibility; no drop-time model.", verifiedAt: "2026-08-11" } },
  ]
};

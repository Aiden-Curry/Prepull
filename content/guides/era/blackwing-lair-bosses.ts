import type { GuideContent } from "../../../lib/guides/types.ts";
import { icy, p, section, source, wowhead } from "../helpers.ts";

// Content is keyed by accepted encounter ID; names/order live in ERA_RAIDS.
export const blackwingLairBossContent: Record<string, GuideContent> = {
  "era-boss-50610": {
    summary: "Protect the orb controller, destroy the eggs, then establish two tanks before attacking Razorgore.",
    tags: ["Adds", "Control", "Threat"],
    quick: {
      before: "Assign orb rotation, corner teams and the final controller tank.",
      during: "Control adds while Razorgore destroys eggs; only damage him after the transition.",
      watch: "Loose casters, interrupted control and Conflagration tank changes.",
    },
    sources: [
      wowhead("Razorgore — Classic encounter strategy", "razorgore-the-untamed-blackwing-lair-strategy"),
      icy("Razorgore — standard Classic strategy only; seasonal additions excluded", "razorgore-the-untamed-guide-strategy-abilities-loot-updated-for-the-season-of-mastery"),
    ].map(entry => ({ ...entry, accessedAt: "2026-09-22" })),
    sections: [
      section("mechanics", "Key mechanics", p("Kill Grethok and his guards, then use the Orb of Domination to control Razorgore. Destroy Egg is the controller's priority. Killing Razorgore while eggs remain wipes the raid."), p("Control lasts up to 90 seconds; Mind Exhaustion prevents immediate reuse, so arrange a second controller. Protect the player at the orb and Razorgore himself. Destroying the final egg releases him and makes surviving adds flee.")),
      section("positioning", "Positioning", p("Assign tanks and melee to the four spawn corners, with ranged and healers positioned to support them. Keep add-control routes clear. For phase two, choose a boss position near usable pillars so players can break line of sight for Fireball Volley without abandoning tank healing.")),
      section("tank", "Tank", p("Pick up incoming adds promptly. Have a tank control the final eggs: Razorgore initially targets the last controller and is taunt-immune. Both boss tanks must build threat; Conflagration disorients the leading tank, making the next threat target responsible for holding him.")),
      section("healer", "Healer", p("Cover every corner and the orb user. Call loose enemies before healing threat pulls them through the group. During phase two, coordinate movement behind pillars so someone always covers the active tank.")),
      section("dps", "DPS", p("Common strategy: kill dangerous Blackwing Mages quickly, then help with assigned legionnaires and dragonkin. A coordinated kill plan or assigned kiting/control can work; do not improvise a different plan mid-pull. Let both tanks establish threat after the last egg.")),
      section("dispels", "Interrupts and crowd control", p("Interrupt Blackwing Mage casts. Use assigned Polymorph on humanoids and Hibernate on dragonkin; protect controlled targets from cleave. Conflagration requires prepared tank coverage rather than relying on a routine cleanse.")),
      section("preparation", "Preparation and resistance", p("Name controller backups and announce handoffs before control ends. Choose pillar positions and add pickups before pulling. Fire protection can help in phase two, but cannot replace control assignments.")),
      section("mistakes", "Common mistakes", p("Damaging Razorgore during the egg phase, leaving casters free, breaking crowd control, or bursting before the second tank has threat can undo an otherwise clean attempt.")),
      section("fury", "Fury Warrior note", p("Reserve rage for assigned Pummel and add pickups. Avoid Whirlwind near controlled enemies or Razorgore during phase one. In phase two, stay below both tanks on threat.")),
      section("related", "Related guides", { kind: "links", guideIds: ["era-blackwing-lair", "era-fury"] }),
    ],
  },
  "era-boss-50611": {
    summary: "Turn rapid resource regeneration into controlled damage while managing lethal Burning Adrenaline and tank succession.",
    tags: ["Threat", "Positioning", "Fire damage"],
    quick: {
      before: "Set tank threat order, healer assignments and a safe Burning Adrenaline exit.",
      during: "Use Essence of the Red aggressively while staying below the next tank's threat.",
      watch: "Burning Adrenaline, tank deaths and the three-minute resource window.",
    },
    sources: [
      wowhead("Vaelastrasz — Classic encounter strategy", "vaelastrasz-the-corrupt-blackwing-lair-strategy"),
      icy("Vaelastrasz — standard Classic positioning and tank succession only", "vaelastrasz-the-corrupt-guide-strategy-abilities-loot-updated-for-the-season-of-mastery"),
      source("Burning Adrenaline — Classic spell effects", "ClassicDB", "https://classicdb.ch/?spell=18173"),
      source("Burning Adrenaline — maximum-health reduction", "ClassicDB", "https://classicdb.ch/?spell=23619"),
    ].map(entry => ({ ...entry, accessedAt: "2026-09-22" })),
    sections: [
      section("mechanics", "Key mechanics", p("Vaelastrasz begins at 30% health. Essence of the Red supplies 500 mana, 50 energy or 20 rage per second for three minutes. Its expiry is a resource-driven soft deadline, not a reason to ignore threat."), p("Burning Adrenaline normally targets a mana user at 15-second intervals, with the current tank targeted on the 45-second cycle. It doubles damage and makes spells instant, but reduces maximum health by 5% each second. Its roughly 20-second duration ends in death and a nearby fire explosion; ordinary healing cannot restore the lost maximum health.")),
      section("positioning", "Positioning", p("Keep the dragon facing the assigned tank. Melee use the flank, outside the frontal Cleave/Flame Breath and rear Tail Sweep. Ranged and healers need tank range plus a clear route to the agreed detonation area. Non-tanks with Burning Adrenaline leave the group immediately, then continue useful actions from a safe distance.")),
      section("tank", "Tank", p("Vaelastrasz is taunt-immune. Successor tanks build threat from the start and stay ahead of DPS without overtaking the active tank early. A tank with Burning Adrenaline holds the agreed facing rather than running through the raid. Coordinate succession and healer transfer as that tank dies; the next tank moves into the tank position without sweeping the frontal attacks across melee.")),
      section("healer", "Healer", p("Use the abundant mana for sustained tank and raid throughput. Fire Nova damages the raid repeatedly while the tank also takes breath damage. Keep the afflicted tank alive for the useful time remaining, then cover the successor. If Burning Adrenaline selects you, announce the lost assignment and move out before continuing heals.")),
      section("dps", "DPS", p("Use the resource supply, but monitor the next tank as well as the current one. Use available threat reductions around transitions. An afflicted caster must separate before exploiting instant casts; the damage bonus does not excuse an explosion inside the group.")),
      section("dispels", "Burning Adrenaline handling", p("Burning Adrenaline has no normal dispel type. Plan isolation and tank succession rather than a cleanse or interrupt rotation to cancel it.")),
      section("preparation", "Preparation and resistance", p("Set positions before starting the dialogue. Prepare enough successor tanks for your expected kill time. Fire protection and suitable resistance help survival, but preserve enough damage and healing throughput to finish within the resource window.")),
      section("mistakes", "Common mistakes", p("Treating replenished resources as permission to ignore threat, taking a late detonation exit, or sending the active tank through the raid causes avoidable deaths.")),
      section("fury", "Fury Warrior note", p("Below 20%, rage-fed Execute creates heavy threat. You have no reliable threat reset: throttle before overtaking a successor tank, even if the current tank still has a large lead.")),
      section("related", "Related guides", { kind: "links", guideIds: ["era-blackwing-lair", "era-fury"] }),
    ],
  },
};

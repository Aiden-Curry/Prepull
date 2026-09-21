import type { GuideContent } from "../../../lib/guides/types.ts";
import { icy, p, section, wowhead } from "../helpers.ts";

type BossText = { sourceSlug: string; summary: string; tags: string[]; before: string; during: string; watch: string; mechanics: string; positioning: string; tank: string; healer: string; dps: string; dispels: string; preparation: string; mistakes: string; fury: string; extraSource?: string };
// Mechanics are authored by accepted encounter ID; identity/order is never copied here.
const text: Record<number, BossText> = {
  50663: {
    sourceSlug: "lucifron", summary: "Control two protectors and remove curses and dangerous magic promptly.", tags: ["Adds", "Dispel"],
    before: "Clear nearby hounds; assign protectors and dispels.", during: "Focus protectors, then the boss.", watch: "Mind control, Impending Doom and resource-cost curses.",
    mechanics: "Lucifron’s Curse raises ability costs. Impending Doom threatens delayed damage; protectors can mind-control players.", positioning: "Face enemies away; keep melee behind and avoid the uncleared tunnel.",
    tank: "Separate target ownership and recover loose protectors.", healer: "Watch dispellers’ health and remove dangerous magic before it overwhelms healing.", dps: "Common strategy: kill both protectors first; avoid damaging mind-controlled allies.",
    dispels: "Mages/Druids remove curses; friendly magic dispels handle Impending Doom and mind control.", preparation: "Restorative Potions can supplement dispels, not replace assignments.", mistakes: "Ignoring curses until rage or mana disappears; accidentally pulling nearby hounds.", fury: "Hold cleave until both protectors are controlled; expensive abilities under the curse can exhaust rage.",
  },
  50664: {
    sourceSlug: "magmadar", summary: "Manage fear, remove Frenzy and leave burning ground.", tags: ["Positioning", "Tank"],
    before: "Assign Tranquilizing Shot and a tank fear plan.", during: "Stay behind; step out of fire.", watch: "Panic and Frenzy overlapping tank damage.",
    mechanics: "Panic fears nearby players. Frenzy increases attack speed; Lava Bomb leaves hazardous ground.", positioning: "Face the boss away; ranged spread with room to move and healers maintain tank range.",
    tank: "Prepare fear protection and keep the frontal attack away from allies.", healer: "Anticipate fear interruptions and heavier tank damage during Frenzy.", dps: "Hunters coordinate Tranquilizing Shot and announce misses so a backup can respond.",
    dispels: "Frenzy needs Tranquilizing Shot, not a normal magic dispel. Arrange available fear prevention or removal.", preparation: "Fire protection can soften mistakes; it does not make burning ground safe.", mistakes: "Remaining in fire or losing healer range while feared.", fury: "Use Berserker Rage for fear management and reposition without crossing the tank’s front.",
  },
  50665: {
    sourceSlug: "gehennas", summary: "Decurse healing reduction and move out of Rain of Fire.", tags: ["Adds", "Dispel", "Positioning"],
    before: "Assign both adds and curse removal.", during: "Kill controlled adds, then the boss.", watch: "Rain of Fire and reduced healing.",
    mechanics: "Gehennas’ Curse sharply reduces healing received. Rain of Fire punishes stationary groups; adds stun nearby players.", positioning: "Spread ranged and leave clear escape paths. Melee attack from behind.",
    tank: "Hold separate targets and move out of fire without turning enemies through melee.", healer: "Prioritize curse removal on endangered tanks before trying to heal through it.", dps: "Common strategy: focus the two adds first; interrupt your damage to leave fire.",
    dispels: "Mages and Druids remove the curse. Maintain coverage after the adds die.", preparation: "Restorative Potions are optional support; Free Action Potion can prevent the add stun when used beforehand.", mistakes: "Stacking ranged or treating reduced healing as merely a healer throughput problem.", fury: "Keep an exit open even during Execute; cleave does not justify standing in Rain of Fire.",
  },
  50666: {
    sourceSlug: "garr", summary: "Control eight Firesworn and keep their death explosions away from players.", tags: ["Adds", "Tank", "Positioning"],
    before: "Mark every Firesworn for tanking or Banish.", during: "Follow the agreed kill order.", watch: "Loose adds and explosions as Firesworn die.",
    mechanics: "Firesworn explode on death. Garr removes buffs with Antimagic Pulse and slows nearby players; add deaths strengthen him.", positioning: "Separate death locations from the raid without dragging adds far from Garr.",
    tank: "Own every unbanished add; have a pickup ready when Banish ends.", healer: "Cover each active tank and anticipate stronger boss damage as adds die.", dps: "Common strategy: control adds while killing Garr, then finish them individually. Other kill orders need explicit assignments.",
    dispels: "Banish controls elementals; refresh your own essential buffs when practical after Antimagic Pulse.", preparation: "Plan tank and Warlock coverage around your roster; there is no single required Warlock count.", mistakes: "Simultaneous add deaths or melee staying beside a dying Firesworn.", fury: "Avoid unassigned Whirlwind/Cleave. Stop and move before the marked add explodes.", extraSource: "garr",
  },
  50667: {
    sourceSlug: "shazzrah", summary: "Remove curses and let a tank recover control after Blink.", tags: ["Dispel", "Positioning"],
    before: "Assign curse removal, offensive dispels and pickup tanks.", during: "Reposition after Blink; pause damage for tank control.", watch: "Arcane Explosion while cursed.",
    mechanics: "Shazzrah’s Curse increases magic damage taken. Deaden Magic reduces incoming magic damage; Blink resets threat.", positioning: "Common strategy: spread ranged away from the boss, with tanks ready to reach Blink destinations.",
    tank: "React promptly to Blink and bring the boss away from vulnerable players.", healer: "Expect melee damage and sudden damage near a Blink landing.", dps: "Wait for renewed threat before resuming; do not chase blindly into the ranged group.",
    dispels: "Remove player curses and purge/dispel Deaden Magic. Casters should watch Counterspell timing.", preparation: "Arcane protection can help melee survival; fire protection does not absorb Arcane Explosion.", mistakes: "Continuing burst immediately after Blink or leaving curses active.", fury: "Step out when survival requires it; losing uptime is preferable to eating cursed explosions.",
  },
  50668: {
    sourceSlug: "baron-geddon", summary: "Carry Living Bomb away and retreat from Inferno.", tags: ["Positioning", "Dispel", "Resistance"],
    before: "Choose a clear bomb exit and safe detonation area.", during: "Leave the group immediately if bombed.", watch: "Inferno and the bomb’s launch/fall damage.",
    mechanics: "Living Bomb explodes around its target and launches them. Inferno damages nearby players; Ignite Mana drains and damages mana users. Near death, Armageddon must be beaten by finishing the boss before its cast completes.", positioning: "Keep a clear path away from the raid. Avoid sending bombed players through another group.",
    tank: "Retreat for Inferno while keeping a route back and healer range.", healer: "Top up the bomb target before detonation and prepare for their landing.", dps: "Stop attacking to leave Inferno; return only when the channel ends.",
    dispels: "Remove Ignite Mana with a friendly magic dispel. Living Bomb requires movement, not a routine dispel assignment.", preparation: "Fire protection and a planned landing area help survival.", mistakes: "Waiting for one more attack before taking a bomb out.", fury: "Cancel your damage plan immediately when bombed. Cooldown uptime never takes priority over the raid’s safety.",
  },
  50669: {
    sourceSlug: "sulfuron-harbinger", summary: "Isolate priest targets and interrupt Dark Mending.", tags: ["Interrupt", "Adds", "Dispel"],
    before: "Assign four priest adds, interrupts and healer coverage.", during: "Focus the marked priest before switching.", watch: "Dark Mending undoing progress.",
    mechanics: "Priests heal with Dark Mending and apply damaging magic. Sulfuron buffs allies and can disrupt his tank.", positioning: "Common strategy: separate the kill target from other priests’ healing range, with healers following their assigned tanks.",
    tank: "Keep boss and spare adds controlled; deliver the next marked priest deliberately.", healer: "Check range across separated groups and respond to tank disruption.", dps: "Rotate interrupts rather than spending all of them on one cast.",
    dispels: "Interrupt Dark Mending. Dispel Immolate and Shadow Word: Pain; remove enemy magic buffs where possible.", preparation: "Set interrupt backups before pulling; resistance does not prevent an enemy heal.", mistakes: "Switching targets early or separating tanks beyond their healers.", fury: "Reserve rage for Pummel when assigned. Cleave is secondary to stopping the heal.",
  },
  50670: {
    sourceSlug: "golemagg-the-incinerator", summary: "Contain the Core Ragers and manage Magma Splash stacks.", tags: ["Tank", "Adds", "Resistance"],
    before: "Assign boss and both Core Ragers separately.", during: "Damage the boss; keep ragers controlled.", watch: "Magma Splash and rising tank pressure.",
    mechanics: "Melee attacks can apply stacking Magma Splash. Core Ragers recover at low health while Golemagg lives; killing them first is not the objective. Pyroblast needs spot healing, and Earthquake adds physical raid damage near the end.", positioning: "Hold the ragers away from the boss and raid, with healers in reach.",
    tank: "Agree a handoff for dangerous stacks. The resting tank stops attacking so stacks can clear.", healer: "Watch boss-tank stacks without losing coverage of the add tanks.", dps: "Stay behind Golemagg; stop attacking to let unsafe stacks expire.",
    dispels: "Magma Splash is managed through attack pauses and tank coordination, not a routine cleanse.", preparation: "Discuss fire survival and handoff signals before the pull.", mistakes: "Wasting damage on ragers or continuing attacks while trying to clear stacks.", fury: "An Execute window does not cancel stack management; step out when needed.", extraSource: "golemagg-the-incinerator",
  },
  50671: {
    sourceSlug: "majordomo-executus", summary: "Defeat eight adds while maintaining control through shields and teleports.", tags: ["Adds", "Tank", "Positioning"],
    before: "Assign four elites, four healers and Majordomo.", during: "Follow marks; watch reflect shields.", watch: "Control breaking and the burning coals.",
    mechanics: "Majordomo surrenders after all eight adds die. Magic Reflection punishes spell attacks; Damage Shield punishes melee attacks.", positioning: "Separate controlled healers from cleave targets. Leave the central coals immediately after a teleport.",
    tank: "Keep Majordomo occupied and prepare pickups as healer control ends.", healer: "Track several tanks and damage caused by shields; anticipate the control transition.", dps: "Common strategy: Polymorph healers while killing elites. After four adds die, remaining healers become immune to Polymorph.",
    dispels: "Control and target selection are central; stop the relevant attacks into reflect shields rather than relying on healing through them.", preparation: "Confirm all seven runes are doused and control backups are ready.", mistakes: "Trying to kill Majordomo or cleaving Polymorphed healers.", fury: "Stop melee attacks into Damage Shield. Do not use Whirlwind near controlled targets.", extraSource: "majordomo-executus",
  },
  50672: {
    sourceSlug: "ragnaros", summary: "Respect Wrath knockbacks and prepare to control Sons of Flame.", tags: ["Positioning", "Tank", "Resistance", "Adds"],
    before: "Assign tank backup, melee retreat and Son pickups.", during: "Move out for Wrath; return after tank control.", watch: "Knockbacks, lava and the submerge transition.",
    mechanics: "Wrath of Ragnaros knocks back nearby players. Without a melee target, Magma Blast threatens the raid. After roughly three minutes he submerges and summons Sons of Flame; their nearby mana burn endangers casters.", positioning: "Melee use the rear; ranged and healers spread to limit shared fire-burst knockbacks, leaving routes back from lava.",
    tank: "Keep a backup ready after knockback and pick up Sons during submerge.", healer: "Maintain tank range while spread; stay away from uncontrolled Sons.", dps: "During submerge, focus assigned Sons and preserve crowd control. Reposition before Ragnaros returns.",
    dispels: "Use available Banish, stuns and roots to control Sons; this is not chiefly a dispel fight.", preparation: "Fire protection and appropriate tank resistance help; prepare the add phase even if planning a fast kill.", mistakes: "Assuming a pre-submerge kill or returning before the tank is established.", fury: "Leave for Wrath promptly. Carry out agreed Son pickups instead of chasing unassigned cleave.", extraSource: "ragnaros",
  },
};

export const moltenCoreBossContent: Record<string, GuideContent> = Object.fromEntries(Object.entries(text).map(([id, boss]) => [`era-boss-${id}`, {
  summary: boss.summary, tags: boss.tags, quick: { before: boss.before, during: boss.during, watch: boss.watch },
  sources: [icy("Boss strategy — standard Classic mechanics", `${boss.sourceSlug}-guide-strategy-abilities-loot`), ...(boss.extraSource ? [{ ...wowhead("Classic encounter strategy", `${boss.extraSource}-molten-core-strategy-wow-classic`), accessedAt: ["baron-geddon", "golemagg-the-incinerator"].includes(boss.extraSource) ? "2026-09-21" : "2026-09-20" }] : [])],
  sections: [section("mechanics", "Key mechanics", p(boss.mechanics)), section("positioning", "Positioning", p(boss.positioning)), section("tank", "Tank", p(boss.tank)), section("healer", "Healer", p(boss.healer)), section("dps", "DPS", p(boss.dps)), section("dispels", "Dispels and interrupts", p(boss.dispels)), section("preparation", "Preparation and resistance", p(boss.preparation)), section("mistakes", "Common mistakes", p(boss.mistakes)), section("fury", "Fury Warrior note", p(boss.fury)), section("related", "Related guides", { kind: "links", guideIds: ["era-molten-core", "era-fury"] })],
}]));

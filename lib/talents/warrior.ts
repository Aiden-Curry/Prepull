import type { ClassicTalentClass } from "./types.ts";

// Classic Era factual metadata; positions and rank IDs pinned to WoWSims.
// Names and icon identifiers checked against Classic Wowhead spell records, 2026-09-21.
export const warriorTalents: ClassicTalentClass = {
  "id": "era-warrior",
  "className": "Warrior",
  "contentVersion": "era",
  "source": "https://github.com/wowsims/classic/blob/ade8d105bb81fb3e4620077b6ddfa73f11c7a60c/ui/core/talents/trees/warrior.json",
  "trees": [
    {
      "id": "arms",
      "name": "Arms"
    },
    {
      "id": "fury",
      "name": "Fury"
    },
    {
      "id": "protection",
      "name": "Protection"
    }
  ],
  "talents": [
    {
      "id": "improvedHeroicStrike",
      "name": "Improved Heroic Strike",
      "tree": "arms",
      "row": 1,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        12282,
        12663,
        12664
      ],
      "icon": "ability_rogue_ambush"
    },
    {
      "id": "deflection",
      "name": "Deflection",
      "tree": "arms",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        16462,
        16463,
        16464,
        16465,
        16466
      ],
      "icon": "ability_parry"
    },
    {
      "id": "improvedRend",
      "name": "Improved Rend",
      "tree": "arms",
      "row": 1,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        12286,
        12658,
        12659
      ],
      "icon": "ability_gouge"
    },
    {
      "id": "improvedCharge",
      "name": "Improved Charge",
      "tree": "arms",
      "row": 2,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        12285,
        12697
      ],
      "icon": "ability_warrior_charge"
    },
    {
      "id": "tacticalMastery",
      "name": "Tactical Mastery",
      "tree": "arms",
      "row": 2,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        12295,
        12676,
        12677,
        12678,
        12679
      ],
      "icon": "spell_nature_enchantarmor"
    },
    {
      "id": "improvedThunderClap",
      "name": "Improved Thunder Clap",
      "tree": "arms",
      "row": 2,
      "column": 4,
      "maxRank": 3,
      "spellIds": [
        12287,
        12665,
        12666
      ],
      "icon": "ability_thunderclap"
    },
    {
      "id": "improvedOverpower",
      "name": "Improved Overpower",
      "tree": "arms",
      "row": 3,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        12290,
        12963
      ],
      "icon": "inv_sword_05"
    },
    {
      "id": "angerManagement",
      "name": "Anger Management",
      "tree": "arms",
      "row": 3,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12296
      ],
      "icon": "spell_holy_blessingofstamina",
      "prerequisite": "tacticalMastery"
    },
    {
      "id": "deepWounds",
      "name": "Deep Wounds",
      "tree": "arms",
      "row": 3,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        12834,
        12849,
        12867
      ],
      "icon": "ability_backstab",
      "prerequisite": "improvedRend"
    },
    {
      "id": "twoHandedWeaponSpecialization",
      "name": "Two-Handed Weapon Specialization",
      "tree": "arms",
      "row": 4,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        12163,
        12711,
        12712,
        12713,
        12714
      ],
      "icon": "inv_axe_09"
    },
    {
      "id": "impale",
      "name": "Impale",
      "tree": "arms",
      "row": 4,
      "column": 3,
      "maxRank": 2,
      "spellIds": [
        16493,
        16494
      ],
      "icon": "ability_searingarrow",
      "prerequisite": "deepWounds"
    },
    {
      "id": "axeSpecialization",
      "name": "Axe Specialization",
      "tree": "arms",
      "row": 5,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        12700,
        12781,
        12783,
        12784,
        12785
      ],
      "icon": "inv_axe_06"
    },
    {
      "id": "sweepingStrikes",
      "name": "Sweeping Strikes",
      "tree": "arms",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12292
      ],
      "icon": "ability_rogue_slicedice"
    },
    {
      "id": "maceSpecialization",
      "name": "Mace Specialization",
      "tree": "arms",
      "row": 5,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        12284,
        12701,
        12702,
        12703,
        12704
      ],
      "icon": "inv_mace_01"
    },
    {
      "id": "swordSpecialization",
      "name": "Sword Specialization",
      "tree": "arms",
      "row": 5,
      "column": 4,
      "maxRank": 5,
      "spellIds": [
        12281,
        12812,
        12813,
        12814,
        12815
      ],
      "icon": "inv_sword_27"
    },
    {
      "id": "polearmSpecialization",
      "name": "Polearm Specialization",
      "tree": "arms",
      "row": 6,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        12165,
        12830,
        12831,
        12832,
        12833
      ],
      "icon": "inv_weapon_halbard_01"
    },
    {
      "id": "improvedHamstring",
      "name": "Improved Hamstring",
      "tree": "arms",
      "row": 6,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        12289,
        12668,
        23695
      ],
      "icon": "ability_shockwave"
    },
    {
      "id": "mortalStrike",
      "name": "Mortal Strike",
      "tree": "arms",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12294
      ],
      "icon": "ability_warrior_savageblow",
      "prerequisite": "sweepingStrikes"
    },
    {
      "id": "boomingVoice",
      "name": "Booming Voice",
      "tree": "fury",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        12321,
        12835,
        12836,
        12837,
        12838
      ],
      "icon": "spell_nature_purge"
    },
    {
      "id": "cruelty",
      "name": "Cruelty",
      "tree": "fury",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        12320,
        12852,
        12853,
        12855,
        12856
      ],
      "icon": "ability_rogue_eviscerate"
    },
    {
      "id": "improvedDemoralizingShout",
      "name": "Improved Demoralizing Shout",
      "tree": "fury",
      "row": 2,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        12324,
        12876,
        12877,
        12878,
        12879
      ],
      "icon": "ability_warrior_warcry"
    },
    {
      "id": "unbridledWrath",
      "name": "Unbridled Wrath",
      "tree": "fury",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        12322,
        12999,
        13000,
        13001,
        13002
      ],
      "icon": "spell_nature_stoneclawtotem"
    },
    {
      "id": "improvedCleave",
      "name": "Improved Cleave",
      "tree": "fury",
      "row": 3,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        12329,
        12950,
        20496
      ],
      "icon": "ability_warrior_cleave"
    },
    {
      "id": "piercingHowl",
      "name": "Piercing Howl",
      "tree": "fury",
      "row": 3,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12323
      ],
      "icon": "spell_shadow_deathscream"
    },
    {
      "id": "bloodCraze",
      "name": "Blood Craze",
      "tree": "fury",
      "row": 3,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        16487,
        16489,
        16492
      ],
      "icon": "spell_shadow_summonimp"
    },
    {
      "id": "improvedBattleShout",
      "name": "Improved Battle Shout",
      "tree": "fury",
      "row": 3,
      "column": 4,
      "maxRank": 5,
      "spellIds": [
        12318,
        12857,
        12858,
        12860,
        12861
      ],
      "icon": "ability_warrior_battleshout"
    },
    {
      "id": "dualWieldSpecialization",
      "name": "Dual Wield Specialization",
      "tree": "fury",
      "row": 4,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        23584,
        23585,
        23586,
        23587,
        23588
      ],
      "icon": "ability_dualwield"
    },
    {
      "id": "improvedExecute",
      "name": "Improved Execute",
      "tree": "fury",
      "row": 4,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        20502,
        20503
      ],
      "icon": "inv_sword_48"
    },
    {
      "id": "enrage",
      "name": "Enrage",
      "tree": "fury",
      "row": 4,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        12317,
        13045,
        13046,
        13047,
        13048
      ],
      "icon": "spell_shadow_unholyfrenzy"
    },
    {
      "id": "improvedSlam",
      "name": "Improved Slam",
      "tree": "fury",
      "row": 5,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        12862,
        12330,
        20497,
        20498,
        20499
      ],
      "icon": "ability_warrior_decisivestrike"
    },
    {
      "id": "deathWish",
      "name": "Death Wish",
      "tree": "fury",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12328
      ],
      "icon": "spell_shadow_deathpact"
    },
    {
      "id": "improvedIntercept",
      "name": "Improved Intercept",
      "tree": "fury",
      "row": 5,
      "column": 4,
      "maxRank": 2,
      "spellIds": [
        20504,
        20505
      ],
      "icon": "ability_rogue_sprint"
    },
    {
      "id": "improvedBerserkerRage",
      "name": "Improved Berserker Rage",
      "tree": "fury",
      "row": 6,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        20500,
        20501
      ],
      "icon": "spell_nature_ancestralguardian"
    },
    {
      "id": "flurry",
      "name": "Flurry",
      "tree": "fury",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        12319,
        12971,
        12972,
        12973,
        12974
      ],
      "icon": "ability_ghoulfrenzy",
      "prerequisite": "enrage"
    },
    {
      "id": "bloodthirst",
      "name": "Bloodthirst",
      "tree": "fury",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        23881
      ],
      "icon": "spell_nature_bloodlust",
      "prerequisite": "deathWish"
    },
    {
      "id": "shieldSpecialization",
      "name": "Shield Specialization",
      "tree": "protection",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        12298,
        12724,
        12725,
        12726,
        12727
      ],
      "icon": "inv_shield_06"
    },
    {
      "id": "anticipation",
      "name": "Anticipation",
      "tree": "protection",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        12297,
        12750,
        12751,
        12752,
        12753
      ],
      "icon": "spell_nature_mirrorimage"
    },
    {
      "id": "improvedBloodrage",
      "name": "Improved Bloodrage",
      "tree": "protection",
      "row": 2,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        12301,
        12818
      ],
      "icon": "ability_racial_bloodrage"
    },
    {
      "id": "toughness",
      "name": "Toughness",
      "tree": "protection",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        12299,
        12761,
        12762,
        12763,
        12764
      ],
      "icon": "spell_holy_devotion"
    },
    {
      "id": "ironWill",
      "name": "Iron Will",
      "tree": "protection",
      "row": 2,
      "column": 4,
      "maxRank": 5,
      "spellIds": [
        12300,
        12959,
        12960,
        12961,
        12962
      ],
      "icon": "spell_magic_magearmor"
    },
    {
      "id": "lastStand",
      "name": "Last Stand",
      "tree": "protection",
      "row": 3,
      "column": 1,
      "maxRank": 1,
      "spellIds": [
        12975
      ],
      "icon": "spell_holy_ashestoashes",
      "prerequisite": "improvedBloodrage"
    },
    {
      "id": "improvedShieldBlock",
      "name": "Improved Shield Block",
      "tree": "protection",
      "row": 3,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        12945,
        12307,
        12944
      ],
      "icon": "ability_defend",
      "prerequisite": "shieldSpecialization"
    },
    {
      "id": "improvedRevenge",
      "name": "Improved Revenge",
      "tree": "protection",
      "row": 3,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        12797,
        12799,
        12800
      ],
      "icon": "ability_warrior_revenge"
    },
    {
      "id": "defiance",
      "name": "Defiance",
      "tree": "protection",
      "row": 3,
      "column": 4,
      "maxRank": 5,
      "spellIds": [
        12303,
        12788,
        12789,
        12791,
        12792
      ],
      "icon": "ability_warrior_innerrage"
    },
    {
      "id": "improvedSunderArmor",
      "name": "Improved Sunder Armor",
      "tree": "protection",
      "row": 4,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        12308,
        12810,
        12811
      ],
      "icon": "ability_warrior_sunder"
    },
    {
      "id": "improvedDisarm",
      "name": "Improved Disarm",
      "tree": "protection",
      "row": 4,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        12313,
        12804,
        12807
      ],
      "icon": "ability_warrior_disarm"
    },
    {
      "id": "improvedTaunt",
      "name": "Improved Taunt",
      "tree": "protection",
      "row": 4,
      "column": 3,
      "maxRank": 2,
      "spellIds": [
        12302,
        12765
      ],
      "icon": "spell_nature_reincarnation"
    },
    {
      "id": "improvedShieldWall",
      "name": "Improved Shield Wall",
      "tree": "protection",
      "row": 5,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        12312,
        12803
      ],
      "icon": "ability_warrior_shieldwall"
    },
    {
      "id": "concussionBlow",
      "name": "Concussion Blow",
      "tree": "protection",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12809
      ],
      "icon": "ability_thunderbolt"
    },
    {
      "id": "improvedShieldBash",
      "name": "Improved Shield Bash",
      "tree": "protection",
      "row": 5,
      "column": 3,
      "maxRank": 2,
      "spellIds": [
        12311,
        12958
      ],
      "icon": "ability_warrior_shieldbash"
    },
    {
      "id": "oneHandedWeaponSpecialization",
      "name": "One-Handed Weapon Specialization",
      "tree": "protection",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        16538,
        16539,
        16540,
        16541,
        16542
      ],
      "icon": "inv_sword_20"
    },
    {
      "id": "shieldSlam",
      "name": "Shield Slam",
      "tree": "protection",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        23922
      ],
      "icon": "inv_shield_05",
      "prerequisite": "concussionBlow"
    }
  ]
};

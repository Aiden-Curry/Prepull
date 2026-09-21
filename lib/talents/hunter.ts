import type { ClassicTalentClass } from "./types.ts";
// Classic Era metadata from the pinned source below; names/icons verified with Classic Wowhead.
// Deflection ranks 4/5 corrected against Classic spell effects: 19301 (4%), 19300 (5%).
export const hunterTalents: ClassicTalentClass = {
  "id": "era-hunter",
  "className": "Hunter",
  "contentVersion": "era",
  "trees": [
    {
      "id": "beast mastery",
      "name": "Beast Mastery"
    },
    {
      "id": "marksmanship",
      "name": "Marksmanship"
    },
    {
      "id": "survival",
      "name": "Survival"
    }
  ],
  "talents": [
    {
      "id": "improvedAspectOfTheHawk",
      "name": "Improved Aspect of the Hawk",
      "tree": "beast mastery",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        19552,
        19553,
        19554,
        19555,
        19556
      ],
      "icon": "spell_nature_ravenform"
    },
    {
      "id": "enduranceTraining",
      "name": "Endurance Training",
      "tree": "beast mastery",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19583,
        19584,
        19585,
        19586,
        19587
      ],
      "icon": "spell_nature_reincarnation"
    },
    {
      "id": "improvedEyesOfTheBeast",
      "name": "Improved Eyes of the Beast",
      "tree": "beast mastery",
      "row": 2,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        19557,
        19558
      ],
      "icon": "ability_eyeoftheowl"
    },
    {
      "id": "improvedAspectOfTheMonkey",
      "name": "Improved Aspect of the Monkey",
      "tree": "beast mastery",
      "row": 2,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        19549,
        19550,
        19551,
        24386,
        24387
      ],
      "icon": "ability_hunter_aspectofthemonkey"
    },
    {
      "id": "thickHide",
      "name": "Thick Hide",
      "tree": "beast mastery",
      "row": 2,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        19609,
        19610,
        19612
      ],
      "icon": "inv_misc_pelt_bear_03"
    },
    {
      "id": "improvedRevivePet",
      "name": "Improved Revive Pet",
      "tree": "beast mastery",
      "row": 2,
      "column": 4,
      "maxRank": 2,
      "spellIds": [
        24443,
        19575
      ],
      "icon": "ability_hunter_beastsoothe"
    },
    {
      "id": "pathfinding",
      "name": "Pathfinding",
      "tree": "beast mastery",
      "row": 3,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        19559,
        19560
      ],
      "icon": "ability_mount_jungletiger"
    },
    {
      "id": "bestialSwiftness",
      "name": "Bestial Swiftness",
      "tree": "beast mastery",
      "row": 3,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        19596
      ],
      "icon": "ability_druid_dash"
    },
    {
      "id": "unleashedFury",
      "name": "Unleashed Fury",
      "tree": "beast mastery",
      "row": 3,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19616,
        19617,
        19618,
        19619,
        19620
      ],
      "icon": "ability_bullrush"
    },
    {
      "id": "improvedMendPet",
      "name": "Improved Mend Pet",
      "tree": "beast mastery",
      "row": 4,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        19572,
        19573
      ],
      "icon": "ability_hunter_mendpet"
    },
    {
      "id": "ferocity",
      "name": "Ferocity",
      "tree": "beast mastery",
      "row": 4,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19598,
        19599,
        19600,
        19601,
        19602
      ],
      "icon": "inv_misc_monsterclaw_04"
    },
    {
      "id": "spiritBond",
      "name": "Spirit Bond",
      "tree": "beast mastery",
      "row": 5,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        19578,
        20895
      ],
      "icon": "classic_ability_druid_demoralizingroar"
    },
    {
      "id": "intimidation",
      "name": "Intimidation",
      "tree": "beast mastery",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        19577
      ],
      "icon": "ability_devour"
    },
    {
      "id": "bestialDiscipline",
      "name": "Bestial Discipline",
      "tree": "beast mastery",
      "row": 5,
      "column": 4,
      "maxRank": 2,
      "spellIds": [
        19590,
        19592
      ],
      "icon": "spell_nature_abolishmagic"
    },
    {
      "id": "frenzy",
      "name": "Frenzy",
      "tree": "beast mastery",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19621,
        19622,
        19623,
        19624,
        19625
      ],
      "icon": "inv_misc_monsterclaw_03",
      "prerequisite": "ferocity"
    },
    {
      "id": "bestialWrath",
      "name": "Bestial Wrath",
      "tree": "beast mastery",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        19574
      ],
      "icon": "ability_druid_ferociousbite",
      "prerequisite": "intimidation"
    },
    {
      "id": "improvedConcussiveShot",
      "name": "Improved Concussive Shot",
      "tree": "marksmanship",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        19407,
        19412,
        19413,
        19414,
        19415
      ],
      "icon": "spell_frost_stun"
    },
    {
      "id": "efficiency",
      "name": "Efficiency",
      "tree": "marksmanship",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19416,
        19417,
        19418,
        19419,
        19420
      ],
      "icon": "spell_frost_wizardmark"
    },
    {
      "id": "improvedHuntersMark",
      "name": "Improved Hunter's Mark",
      "tree": "marksmanship",
      "row": 2,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        19421,
        19422,
        19423,
        19424,
        19425
      ],
      "icon": "ability_hunter_snipershot"
    },
    {
      "id": "lethalShots",
      "name": "Lethal Shots",
      "tree": "marksmanship",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19426,
        19427,
        19429,
        19430,
        19431
      ],
      "icon": "ability_searingarrow"
    },
    {
      "id": "aimedShot",
      "name": "Aimed Shot",
      "tree": "marksmanship",
      "row": 3,
      "column": 1,
      "maxRank": 1,
      "spellIds": [
        19434
      ],
      "icon": "inv_spear_07"
    },
    {
      "id": "improvedArcaneShot",
      "name": "Improved Arcane Shot",
      "tree": "marksmanship",
      "row": 3,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        19454,
        19455,
        19456,
        19457,
        19458
      ],
      "icon": "ability_impalingbolt"
    },
    {
      "id": "hawkEye",
      "name": "Hawk Eye",
      "tree": "marksmanship",
      "row": 3,
      "column": 4,
      "maxRank": 3,
      "spellIds": [
        19498,
        19499,
        19500
      ],
      "icon": "ability_townwatch"
    },
    {
      "id": "improvedSerpentSting",
      "name": "Improved Serpent Sting",
      "tree": "marksmanship",
      "row": 4,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        19464,
        19465,
        19466,
        19467,
        19468
      ],
      "icon": "ability_hunter_quickshot"
    },
    {
      "id": "mortalShots",
      "name": "Mortal Shots",
      "tree": "marksmanship",
      "row": 4,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19485,
        19487,
        19488,
        19489,
        19490
      ],
      "icon": "ability_piercedamage",
      "prerequisite": "lethalShots"
    },
    {
      "id": "scatterShot",
      "name": "Scatter Shot",
      "tree": "marksmanship",
      "row": 5,
      "column": 1,
      "maxRank": 1,
      "spellIds": [
        19503
      ],
      "icon": "ability_golemstormbolt"
    },
    {
      "id": "barrage",
      "name": "Barrage",
      "tree": "marksmanship",
      "row": 5,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        19461,
        19462,
        24691
      ],
      "icon": "ability_upgrademoonglaive"
    },
    {
      "id": "improvedScorpidSting",
      "name": "Improved Scorpid Sting",
      "tree": "marksmanship",
      "row": 5,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        19491,
        19493,
        19494
      ],
      "icon": "ability_hunter_criticalshot"
    },
    {
      "id": "rangedWeaponSpecialization",
      "name": "Ranged Weapon Specialization",
      "tree": "marksmanship",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19507,
        19508,
        19509,
        19510,
        19511
      ],
      "icon": "inv_weapon_rifle_06"
    },
    {
      "id": "trueshotAura",
      "name": "Trueshot Aura",
      "tree": "marksmanship",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        19506
      ],
      "icon": "ability_trueshot",
      "prerequisite": "barrage"
    },
    {
      "id": "monsterSlaying",
      "name": "Monster Slaying",
      "tree": "survival",
      "row": 1,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        24293,
        24294,
        24295
      ],
      "icon": "inv_misc_head_dragon_black"
    },
    {
      "id": "humanoidSlaying",
      "name": "Humanoid Slaying",
      "tree": "survival",
      "row": 1,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        19151,
        19152,
        19153
      ],
      "icon": "spell_holy_prayerofhealing"
    },
    {
      "id": "deflection",
      "name": "Deflection",
      "tree": "survival",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19295,
        19297,
        19298,
        19301,
        19300
      ],
      "icon": "ability_parry"
    },
    {
      "id": "entrapment",
      "name": "Entrapment",
      "tree": "survival",
      "row": 2,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        19184,
        19387,
        19388,
        19389,
        19390
      ],
      "icon": "spell_nature_stranglevines"
    },
    {
      "id": "savageStrikes",
      "name": "Savage Strikes",
      "tree": "survival",
      "row": 2,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        19159,
        19160
      ],
      "icon": "ability_racial_bloodrage"
    },
    {
      "id": "improvedWingClip",
      "name": "Improved Wing Clip",
      "tree": "survival",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19228,
        19232,
        19233,
        19234,
        19235
      ],
      "icon": "ability_rogue_trip"
    },
    {
      "id": "cleverTraps",
      "name": "Clever Traps",
      "tree": "survival",
      "row": 3,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        19239,
        19245
      ],
      "icon": "spell_nature_timestop"
    },
    {
      "id": "survivalist",
      "name": "Survivalist",
      "tree": "survival",
      "row": 3,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        19255,
        19256,
        19257,
        19258,
        19259
      ],
      "icon": "spell_shadow_twilight"
    },
    {
      "id": "deterrence",
      "name": "Deterrence",
      "tree": "survival",
      "row": 3,
      "column": 3,
      "maxRank": 1,
      "spellIds": [
        19263
      ],
      "icon": "ability_whirlwind"
    },
    {
      "id": "trapMastery",
      "name": "Trap Mastery",
      "tree": "survival",
      "row": 4,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        19376,
        19377
      ],
      "icon": "ability_ensnare"
    },
    {
      "id": "surefooted",
      "name": "Surefooted",
      "tree": "survival",
      "row": 4,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        19290,
        19294,
        24283
      ],
      "icon": "ability_kick"
    },
    {
      "id": "improvedFeignDeath",
      "name": "Improved Feign Death",
      "tree": "survival",
      "row": 4,
      "column": 4,
      "maxRank": 2,
      "spellIds": [
        19286,
        19287
      ],
      "icon": "ability_rogue_feigndeath"
    },
    {
      "id": "killerInstinct",
      "name": "Killer Instinct",
      "tree": "survival",
      "row": 5,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        19370,
        19371,
        19373
      ],
      "icon": "spell_holy_blessingofstamina"
    },
    {
      "id": "counterattack",
      "name": "Counterattack",
      "tree": "survival",
      "row": 5,
      "column": 3,
      "maxRank": 1,
      "spellIds": [
        19306
      ],
      "icon": "ability_warrior_challange",
      "prerequisite": "deterrence"
    },
    {
      "id": "lightningReflexes",
      "name": "Lightning Reflexes",
      "tree": "survival",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        19168,
        19180,
        19181,
        24296,
        24297
      ],
      "icon": "spell_nature_invisibilty"
    },
    {
      "id": "wyvernSting",
      "name": "Wyvern Sting",
      "tree": "survival",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        19386
      ],
      "icon": "inv_spear_02",
      "prerequisite": "killerInstinct"
    }
  ],
  "source": "https://github.com/wowsims/classic/blob/c925c1184dcd0c5eaff2d128af899be639235b63/ui/core/talents/trees/hunter.json"
};

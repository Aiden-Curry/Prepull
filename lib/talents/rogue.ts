import type { ClassicTalentClass } from "./types.ts";
// Classic Era metadata from the pinned source below; names/icons verified with Classic Wowhead.
// Improved Gouge rank order corrected against Classic spell effects: 13793 (+1s), 13792 (+1.5s).
export const rogueTalents: ClassicTalentClass = {
  "id": "era-rogue",
  "className": "Rogue",
  "contentVersion": "era",
  "trees": [
    {
      "id": "assassination",
      "name": "Assassination"
    },
    {
      "id": "combat",
      "name": "Combat"
    },
    {
      "id": "subtlety",
      "name": "Subtlety"
    }
  ],
  "talents": [
    {
      "id": "improvedEviscerate",
      "name": "Improved Eviscerate",
      "tree": "assassination",
      "row": 1,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        14162,
        14163,
        14164
      ],
      "icon": "ability_rogue_eviscerate"
    },
    {
      "id": "remorselessAttacks",
      "name": "Remorseless Attacks",
      "tree": "assassination",
      "row": 1,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        14144,
        14148
      ],
      "icon": "ability_fiegndead"
    },
    {
      "id": "malice",
      "name": "Malice",
      "tree": "assassination",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        14138,
        14139,
        14140,
        14141,
        14142
      ],
      "icon": "ability_racial_bloodrage"
    },
    {
      "id": "ruthlessness",
      "name": "Ruthlessness",
      "tree": "assassination",
      "row": 2,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        14156,
        14160,
        14161
      ],
      "icon": "ability_druid_disembowel"
    },
    {
      "id": "murder",
      "name": "Murder",
      "tree": "assassination",
      "row": 2,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        14158,
        14159
      ],
      "icon": "spell_shadow_deathscream"
    },
    {
      "id": "improvedSliceAndDice",
      "name": "Improved Slice and Dice",
      "tree": "assassination",
      "row": 2,
      "column": 4,
      "maxRank": 3,
      "spellIds": [
        14165,
        14166,
        14167
      ],
      "icon": "ability_rogue_slicedice"
    },
    {
      "id": "relentlessStrikes",
      "name": "Relentless Strikes",
      "tree": "assassination",
      "row": 3,
      "column": 1,
      "maxRank": 1,
      "spellIds": [
        14179
      ],
      "icon": "ability_warrior_decisivestrike"
    },
    {
      "id": "improvedExposeArmor",
      "name": "Improved Expose Armor",
      "tree": "assassination",
      "row": 3,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        14168,
        14169
      ],
      "icon": "ability_warrior_riposte"
    },
    {
      "id": "lethality",
      "name": "Lethality",
      "tree": "assassination",
      "row": 3,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        14128,
        14132,
        14135,
        14136,
        14137
      ],
      "icon": "ability_criticalstrike",
      "prerequisite": "malice"
    },
    {
      "id": "vilePoisons",
      "name": "Vile Poisons",
      "tree": "assassination",
      "row": 4,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        16513,
        16514,
        16515,
        16719,
        16720
      ],
      "icon": "ability_rogue_feigndeath"
    },
    {
      "id": "improvedPoisons",
      "name": "Improved Poisons",
      "tree": "assassination",
      "row": 4,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        14113,
        14114,
        14115,
        14116,
        14117
      ],
      "icon": "ability_poisons"
    },
    {
      "id": "coldBlood",
      "name": "Cold Blood",
      "tree": "assassination",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        14177
      ],
      "icon": "spell_ice_lament"
    },
    {
      "id": "improvedKidneyShot",
      "name": "Improved Kidney Shot",
      "tree": "assassination",
      "row": 5,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        14174,
        14175,
        14176
      ],
      "icon": "ability_rogue_kidneyshot"
    },
    {
      "id": "sealFate",
      "name": "Seal Fate",
      "tree": "assassination",
      "row": 6,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        14186,
        14190,
        14193,
        14194,
        14195
      ],
      "icon": "spell_shadow_chilltouch",
      "prerequisite": "coldBlood"
    },
    {
      "id": "vigor",
      "name": "Vigor",
      "tree": "assassination",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        14983
      ],
      "icon": "spell_nature_earthbindtotem"
    },
    {
      "id": "improvedGouge",
      "name": "Improved Gouge",
      "tree": "combat",
      "row": 1,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        13741,
        13793,
        13792
      ],
      "icon": "ability_gouge"
    },
    {
      "id": "improvedSinisterStrike",
      "name": "Improved Sinister Strike",
      "tree": "combat",
      "row": 1,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        13732,
        13863
      ],
      "icon": "spell_shadow_ritualofsacrifice"
    },
    {
      "id": "lightningReflexes",
      "name": "Lightning Reflexes",
      "tree": "combat",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        13712,
        13788,
        13789,
        13790,
        13791
      ],
      "icon": "spell_nature_invisibilty"
    },
    {
      "id": "improvedBackstab",
      "name": "Improved Backstab",
      "tree": "combat",
      "row": 2,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        13733,
        13865,
        13866
      ],
      "icon": "ability_backstab"
    },
    {
      "id": "deflection",
      "name": "Deflection",
      "tree": "combat",
      "row": 2,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        13713,
        13853,
        13854,
        13855,
        13856
      ],
      "icon": "ability_parry"
    },
    {
      "id": "precision",
      "name": "Precision",
      "tree": "combat",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        13705,
        13832,
        13843,
        13844,
        13845
      ],
      "icon": "ability_marksmanship"
    },
    {
      "id": "endurance",
      "name": "Endurance",
      "tree": "combat",
      "row": 3,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        13742,
        13872
      ],
      "icon": "spell_shadow_shadowward"
    },
    {
      "id": "riposte",
      "name": "Riposte",
      "tree": "combat",
      "row": 3,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        14251
      ],
      "icon": "ability_warrior_challange",
      "prerequisite": "deflection"
    },
    {
      "id": "improvedSprint",
      "name": "Improved Sprint",
      "tree": "combat",
      "row": 3,
      "column": 4,
      "maxRank": 2,
      "spellIds": [
        13743,
        13875
      ],
      "icon": "ability_rogue_sprint"
    },
    {
      "id": "improvedKick",
      "name": "Improved Kick",
      "tree": "combat",
      "row": 4,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        13754,
        13867
      ],
      "icon": "ability_kick"
    },
    {
      "id": "daggerSpecialization",
      "name": "Dagger Specialization",
      "tree": "combat",
      "row": 4,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        13706,
        13804,
        13805,
        13806,
        13807
      ],
      "icon": "inv_weapon_shortblade_05"
    },
    {
      "id": "dualWieldSpecialization",
      "name": "Dual Wield Specialization",
      "tree": "combat",
      "row": 4,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        13715,
        13848,
        13849,
        13851,
        13852
      ],
      "icon": "ability_dualwield",
      "prerequisite": "precision"
    },
    {
      "id": "maceSpecialization",
      "name": "Mace Specialization",
      "tree": "combat",
      "row": 5,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        13709,
        13800,
        13801,
        13802,
        13803
      ],
      "icon": "inv_mace_01"
    },
    {
      "id": "bladeFlurry",
      "name": "Blade Flurry",
      "tree": "combat",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        13877
      ],
      "icon": "ability_warrior_punishingblow"
    },
    {
      "id": "swordSpecialization",
      "name": "Sword Specialization",
      "tree": "combat",
      "row": 5,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        13960,
        13961,
        13962,
        13963,
        13964
      ],
      "icon": "inv_sword_27"
    },
    {
      "id": "fistWeaponSpecialization",
      "name": "Fist Weapon Specialization",
      "tree": "combat",
      "row": 5,
      "column": 4,
      "maxRank": 5,
      "spellIds": [
        13707,
        13966,
        13967,
        13968,
        13969
      ],
      "icon": "inv_gauntlets_04"
    },
    {
      "id": "weaponExpertise",
      "name": "Weapon Expertise",
      "tree": "combat",
      "row": 6,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        30919,
        30920
      ],
      "icon": "spell_holy_blessingofstrength",
      "prerequisite": "bladeFlurry"
    },
    {
      "id": "aggression",
      "name": "Aggression",
      "tree": "combat",
      "row": 6,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        18427,
        18428,
        18429
      ],
      "icon": "ability_racial_avatar"
    },
    {
      "id": "adrenalineRush",
      "name": "Adrenaline Rush",
      "tree": "combat",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        13750
      ],
      "icon": "spell_shadow_shadowworddominate"
    },
    {
      "id": "masterOfDeception",
      "name": "Master of Deception",
      "tree": "subtlety",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        13958,
        13970,
        13971,
        13972,
        13973
      ],
      "icon": "spell_shadow_charm"
    },
    {
      "id": "opportunity",
      "name": "Opportunity",
      "tree": "subtlety",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        14057,
        14072,
        14073,
        14074,
        14075
      ],
      "icon": "ability_warrior_warcry"
    },
    {
      "id": "sleightOfHand",
      "name": "Sleight of Hand",
      "tree": "subtlety",
      "row": 2,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        30892,
        30893
      ],
      "icon": "ability_rogue_feint"
    },
    {
      "id": "elusiveness",
      "name": "Elusiveness",
      "tree": "subtlety",
      "row": 2,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        13981,
        14066
      ],
      "icon": "spell_magic_lesserinvisibilty"
    },
    {
      "id": "camouflage",
      "name": "Camouflage",
      "tree": "subtlety",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        13975,
        14062,
        14063,
        14064,
        14065
      ],
      "icon": "ability_stealth"
    },
    {
      "id": "initiative",
      "name": "Initiative",
      "tree": "subtlety",
      "row": 3,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        13976,
        13979,
        13980
      ],
      "icon": "spell_shadow_fumble"
    },
    {
      "id": "ghostlyStrike",
      "name": "Ghostly Strike",
      "tree": "subtlety",
      "row": 3,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        14278
      ],
      "icon": "spell_shadow_curse"
    },
    {
      "id": "improvedAmbush",
      "name": "Improved Ambush",
      "tree": "subtlety",
      "row": 3,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        14079,
        14080,
        14081
      ],
      "icon": "ability_rogue_ambush"
    },
    {
      "id": "setup",
      "name": "Setup",
      "tree": "subtlety",
      "row": 4,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        13983,
        14070,
        14071
      ],
      "icon": "spell_nature_mirrorimage"
    },
    {
      "id": "improvedSap",
      "name": "Improved Sap",
      "tree": "subtlety",
      "row": 4,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        14076,
        14094,
        14095
      ],
      "icon": "ability_sap"
    },
    {
      "id": "serratedBlades",
      "name": "Serrated Blades",
      "tree": "subtlety",
      "row": 4,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        14171,
        14172,
        14173
      ],
      "icon": "inv_sword_17"
    },
    {
      "id": "heightenedSenses",
      "name": "Heightened Senses",
      "tree": "subtlety",
      "row": 5,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        30894,
        30895
      ],
      "icon": "ability_ambush"
    },
    {
      "id": "preparation",
      "name": "Preparation",
      "tree": "subtlety",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        14185
      ],
      "icon": "spell_shadow_antishadow"
    },
    {
      "id": "dirtyDeeds",
      "name": "Dirty Deeds",
      "tree": "subtlety",
      "row": 5,
      "column": 3,
      "maxRank": 2,
      "spellIds": [
        14082,
        14083
      ],
      "icon": "spell_shadow_summonsuccubus"
    },
    {
      "id": "hemorrhage",
      "name": "Hemorrhage",
      "tree": "subtlety",
      "row": 5,
      "column": 4,
      "maxRank": 1,
      "spellIds": [
        16511
      ],
      "icon": "spell_shadow_lifedrain",
      "prerequisite": "serratedBlades"
    },
    {
      "id": "deadliness",
      "name": "Deadliness",
      "tree": "subtlety",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        30902,
        30903,
        30904,
        30905,
        30906
      ],
      "icon": "inv_weapon_crossbow_11"
    },
    {
      "id": "premeditation",
      "name": "Premeditation",
      "tree": "subtlety",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        14183
      ],
      "icon": "spell_shadow_possession",
      "prerequisite": "preparation"
    }
  ],
  "source": "https://github.com/wowsims/classic/blob/cf192c7a6200cce6c33630016fe32469d6db0e89/ui/core/talents/trees/rogue.json"
};

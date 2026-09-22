import type { ClassicTalentClass } from "./types.ts";
// Classic Era metadata from the pinned source below; names/icons verified with Classic Wowhead.
// Shadow Focus ranks 4/5 completed from Classic spell records (8% and 10% resistance reduction).
export const priestTalents: ClassicTalentClass = {
  "id": "era-priest",
  "className": "Priest",
  "contentVersion": "era",
  "trees": [
    {
      "id": "discipline",
      "name": "Discipline"
    },
    {
      "id": "holy",
      "name": "Holy"
    },
    {
      "id": "shadow",
      "name": "Shadow"
    }
  ],
  "talents": [
    {
      "id": "unbreakableWill",
      "name": "Unbreakable Will",
      "tree": "discipline",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        14522,
        14788,
        14789,
        14790,
        14791
      ],
      "icon": "spell_magic_magearmor"
    },
    {
      "id": "wandSpecialization",
      "name": "Wand Specialization",
      "tree": "discipline",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        14524,
        14525,
        14526,
        14527,
        14528
      ],
      "icon": "inv_wand_01"
    },
    {
      "id": "silentResolve",
      "name": "Silent Resolve",
      "tree": "discipline",
      "row": 2,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        14523,
        14784,
        14785,
        14786,
        14787
      ],
      "icon": "spell_nature_manaregentotem"
    },
    {
      "id": "improvedPowerWordFortitude",
      "name": "Improved Power Word: Fortitude",
      "tree": "discipline",
      "row": 2,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        14749,
        14767
      ],
      "icon": "spell_holy_wordfortitude"
    },
    {
      "id": "improvedPowerWordShield",
      "name": "Improved Power Word: Shield",
      "tree": "discipline",
      "row": 2,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        14748,
        14768,
        14769
      ],
      "icon": "spell_holy_powerwordshield"
    },
    {
      "id": "martyrdom",
      "name": "Martyrdom",
      "tree": "discipline",
      "row": 2,
      "column": 4,
      "maxRank": 2,
      "spellIds": [
        14531,
        14774
      ],
      "icon": "spell_nature_tranquility"
    },
    {
      "id": "innerFocus",
      "name": "Inner Focus",
      "tree": "discipline",
      "row": 3,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        14751
      ],
      "icon": "spell_frost_windwalkon"
    },
    {
      "id": "meditation",
      "name": "Meditation",
      "tree": "discipline",
      "row": 3,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        14521,
        14776,
        14777
      ],
      "icon": "spell_nature_sleep"
    },
    {
      "id": "improvedInnerFire",
      "name": "Improved Inner Fire",
      "tree": "discipline",
      "row": 4,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        14747,
        14770,
        14771
      ],
      "icon": "spell_holy_innerfire"
    },
    {
      "id": "mentalAgility",
      "name": "Mental Agility",
      "tree": "discipline",
      "row": 4,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        14520,
        14780,
        14781,
        14782,
        14783
      ],
      "icon": "ability_hibernation"
    },
    {
      "id": "improvedManaBurn",
      "name": "Improved Mana Burn",
      "tree": "discipline",
      "row": 4,
      "column": 4,
      "maxRank": 2,
      "spellIds": [
        14750,
        14772
      ],
      "icon": "spell_shadow_manaburn"
    },
    {
      "id": "mentalStrength",
      "name": "Mental Strength",
      "tree": "discipline",
      "row": 5,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        18551,
        18552,
        18553,
        18554,
        18555
      ],
      "icon": "spell_nature_enchantarmor"
    },
    {
      "id": "divineSpirit",
      "name": "Divine Spirit",
      "tree": "discipline",
      "row": 5,
      "column": 3,
      "maxRank": 1,
      "spellIds": [
        14752
      ],
      "icon": "spell_holy_divinespirit",
      "prerequisite": "meditation"
    },
    {
      "id": "forceOfWill",
      "name": "Force of Will",
      "tree": "discipline",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        18544,
        18547,
        18548,
        18549,
        18550
      ],
      "icon": "spell_nature_slowingtotem"
    },
    {
      "id": "powerInfusion",
      "name": "Power Infusion",
      "tree": "discipline",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        10060
      ],
      "icon": "spell_holy_powerinfusion",
      "prerequisite": "mentalStrength"
    },
    {
      "id": "healingFocus",
      "name": "Healing Focus",
      "tree": "holy",
      "row": 1,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        14913,
        15012
      ],
      "icon": "spell_holy_healingfocus"
    },
    {
      "id": "improvedRenew",
      "name": "Improved Renew",
      "tree": "holy",
      "row": 1,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        14908,
        15020,
        17191
      ],
      "icon": "spell_holy_renew"
    },
    {
      "id": "holySpecialization",
      "name": "Holy Specialization",
      "tree": "holy",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        14889,
        15008,
        15009,
        15010,
        15011
      ],
      "icon": "spell_holy_sealofsalvation"
    },
    {
      "id": "spellWarding",
      "name": "Spell Warding",
      "tree": "holy",
      "row": 2,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        27900,
        27901,
        27902,
        27903,
        27904
      ],
      "icon": "spell_holy_spellwarding"
    },
    {
      "id": "divineFury",
      "name": "Divine Fury",
      "tree": "holy",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        18530,
        18531,
        18533,
        18534,
        18535
      ],
      "icon": "spell_holy_sealofwrath"
    },
    {
      "id": "holyNova",
      "name": "Holy Nova",
      "tree": "holy",
      "row": 3,
      "column": 1,
      "maxRank": 1,
      "spellIds": [
        15237
      ],
      "icon": "spell_holy_holynova"
    },
    {
      "id": "blessedRecovery",
      "name": "Blessed Recovery",
      "tree": "holy",
      "row": 3,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        27811,
        27815,
        27816
      ],
      "icon": "spell_holy_blessedrecovery"
    },
    {
      "id": "inspiration",
      "name": "Inspiration",
      "tree": "holy",
      "row": 3,
      "column": 4,
      "maxRank": 3,
      "spellIds": [
        14892,
        15362,
        15363
      ],
      "icon": "spell_holy_layonhands"
    },
    {
      "id": "holyReach",
      "name": "Holy Reach",
      "tree": "holy",
      "row": 4,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        27789,
        27790
      ],
      "icon": "spell_holy_purify"
    },
    {
      "id": "improvedHealing",
      "name": "Improved Healing",
      "tree": "holy",
      "row": 4,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        14912,
        15013,
        15014
      ],
      "icon": "spell_holy_heal02"
    },
    {
      "id": "searingLight",
      "name": "Searing Light",
      "tree": "holy",
      "row": 4,
      "column": 3,
      "maxRank": 2,
      "spellIds": [
        14909,
        15017
      ],
      "icon": "spell_holy_searinglightpriest",
      "prerequisite": "divineFury"
    },
    {
      "id": "improvedPrayerOfHealing",
      "name": "Improved Prayer of Healing",
      "tree": "holy",
      "row": 5,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        14911,
        15018
      ],
      "icon": "spell_holy_prayerofhealing02"
    },
    {
      "id": "spiritOfRedemption",
      "name": "Spirit of Redemption",
      "tree": "holy",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        20711
      ],
      "icon": "inv_enchant_essenceeternallarge"
    },
    {
      "id": "spiritualGuidance",
      "name": "Spiritual Guidance",
      "tree": "holy",
      "row": 5,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        14901,
        15028,
        15029,
        15030,
        15031
      ],
      "icon": "spell_holy_spiritualguidence"
    },
    {
      "id": "spiritualHealing",
      "name": "Spiritual Healing",
      "tree": "holy",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        14898,
        15349,
        15354,
        15355,
        15356
      ],
      "icon": "spell_nature_moonglow"
    },
    {
      "id": "lightwell",
      "name": "Lightwell",
      "tree": "holy",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        724
      ],
      "icon": "spell_holy_summonlightwell",
      "prerequisite": "spiritOfRedemption"
    },
    {
      "id": "spiritTap",
      "name": "Spirit Tap",
      "tree": "shadow",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        15270,
        15335,
        15336,
        15337,
        15338
      ],
      "icon": "spell_shadow_requiem"
    },
    {
      "id": "blackout",
      "name": "Blackout",
      "tree": "shadow",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        15268,
        15323,
        15324,
        15325,
        15326
      ],
      "icon": "spell_shadow_gathershadows"
    },
    {
      "id": "shadowAffinity",
      "name": "Shadow Affinity",
      "tree": "shadow",
      "row": 2,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        15318,
        15272,
        15320
      ],
      "icon": "spell_shadow_shadowward"
    },
    {
      "id": "improvedShadowWordPain",
      "name": "Improved Shadow Word: Pain",
      "tree": "shadow",
      "row": 2,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        15275,
        15317
      ],
      "icon": "spell_shadow_shadowwordpain"
    },
    {
      "id": "shadowFocus",
      "name": "Shadow Focus",
      "tree": "shadow",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        15260,
        15327,
        15328,
        15329,
        15330
      ],
      "icon": "spell_shadow_burningspirit"
    },
    {
      "id": "improvedPsychicScream",
      "name": "Improved Psychic Scream",
      "tree": "shadow",
      "row": 3,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        15392,
        15448
      ],
      "icon": "spell_shadow_psychicscream"
    },
    {
      "id": "improvedMindBlast",
      "name": "Improved Mind Blast",
      "tree": "shadow",
      "row": 3,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        15273,
        15312,
        15313,
        15314,
        15316
      ],
      "icon": "spell_shadow_unholyfrenzy"
    },
    {
      "id": "mindFlay",
      "name": "Mind Flay",
      "tree": "shadow",
      "row": 3,
      "column": 3,
      "maxRank": 1,
      "spellIds": [
        15407
      ],
      "icon": "spell_shadow_siphonmana"
    },
    {
      "id": "improvedFade",
      "name": "Improved Fade",
      "tree": "shadow",
      "row": 4,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        15274,
        15311
      ],
      "icon": "spell_magic_lesserinvisibilty"
    },
    {
      "id": "shadowReach",
      "name": "Shadow Reach",
      "tree": "shadow",
      "row": 4,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        17322,
        17323,
        17325
      ],
      "icon": "spell_shadow_chilltouch"
    },
    {
      "id": "shadowWeaving",
      "name": "Shadow Weaving",
      "tree": "shadow",
      "row": 4,
      "column": 4,
      "maxRank": 5,
      "spellIds": [
        15257,
        15331,
        15332,
        15333,
        15334
      ],
      "icon": "spell_shadow_blackplague"
    },
    {
      "id": "silence",
      "name": "Silence",
      "tree": "shadow",
      "row": 5,
      "column": 1,
      "maxRank": 1,
      "spellIds": [
        15487
      ],
      "icon": "spell_shadow_impphaseshift",
      "prerequisite": "improvedPsychicScream"
    },
    {
      "id": "vampiricEmbrace",
      "name": "Vampiric Embrace",
      "tree": "shadow",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        15286
      ],
      "icon": "spell_shadow_unsummonbuilding"
    },
    {
      "id": "improvedVampiricEmbrace",
      "name": "Improved Vampiric Embrace",
      "tree": "shadow",
      "row": 5,
      "column": 3,
      "maxRank": 2,
      "spellIds": [
        27839,
        27840
      ],
      "icon": "spell_shadow_improvedvampiricembrace",
      "prerequisite": "vampiricEmbrace"
    },
    {
      "id": "darkness",
      "name": "Darkness",
      "tree": "shadow",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        15259,
        15307,
        15308,
        15309,
        15310
      ],
      "icon": "spell_shadow_twilight"
    },
    {
      "id": "shadowform",
      "name": "Shadowform",
      "tree": "shadow",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        15473
      ],
      "icon": "spell_shadow_shadowform",
      "prerequisite": "vampiricEmbrace"
    }
  ],
  "source": "https://github.com/wowsims/classic/blob/c925c1184dcd0c5eaff2d128af899be639235b63/ui/core/talents/trees/priest.json"
};

import type { ClassicTalentClass } from "./types.ts";
// Classic Era positions/ranks/prerequisites: pinned WoWSims source below.
// Names and icons verified through Classic Wowhead first-rank spell metadata.
export const mageTalents: ClassicTalentClass = {
  "id": "era-mage",
  "className": "Mage",
  "contentVersion": "era",
  "trees": [
    {
      "id": "arcane",
      "name": "Arcane"
    },
    {
      "id": "fire",
      "name": "Fire"
    },
    {
      "id": "frost",
      "name": "Frost"
    }
  ],
  "talents": [
    {
      "id": "arcaneSubtlety",
      "name": "Arcane Subtlety",
      "tree": "arcane",
      "row": 1,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        11210,
        12592
      ],
      "icon": "spell_holy_dispelmagic"
    },
    {
      "id": "arcaneFocus",
      "name": "Arcane Focus",
      "tree": "arcane",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        11222,
        12839,
        12840,
        12841,
        12842
      ],
      "icon": "spell_holy_devotion"
    },
    {
      "id": "improvedArcaneMissiles",
      "name": "Improved Arcane Missiles",
      "tree": "arcane",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        11237,
        12463,
        12464,
        16769,
        16770
      ],
      "icon": "spell_nature_starfall"
    },
    {
      "id": "wandSpecialization",
      "name": "Wand Specialization",
      "tree": "arcane",
      "row": 2,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        6057,
        6085
      ],
      "icon": "inv_wand_01"
    },
    {
      "id": "magicAbsorption",
      "name": "Magic Absorption",
      "tree": "arcane",
      "row": 2,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        29441,
        29444,
        29445,
        29446,
        29447
      ],
      "icon": "spell_nature_astralrecalgroup"
    },
    {
      "id": "arcaneConcentration",
      "name": "Arcane Concentration",
      "tree": "arcane",
      "row": 2,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        11213,
        12574,
        12575,
        12576,
        12577
      ],
      "icon": "spell_shadow_manaburn"
    },
    {
      "id": "magicAttunement",
      "name": "Magic Attunement",
      "tree": "arcane",
      "row": 3,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        11247,
        12606
      ],
      "icon": "spell_nature_abolishmagic"
    },
    {
      "id": "improvedArcaneExplosion",
      "name": "Improved Arcane Explosion",
      "tree": "arcane",
      "row": 3,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        11242,
        12467,
        12469
      ],
      "icon": "spell_nature_wispsplode"
    },
    {
      "id": "arcaneResilience",
      "name": "Arcane Resilience",
      "tree": "arcane",
      "row": 3,
      "column": 3,
      "maxRank": 1,
      "spellIds": [
        28574
      ],
      "icon": "spell_arcane_arcaneresilience"
    },
    {
      "id": "improvedManaShield",
      "name": "Improved Mana Shield",
      "tree": "arcane",
      "row": 4,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        11252,
        12605
      ],
      "icon": "spell_shadow_detectlesserinvisibility"
    },
    {
      "id": "improvedCounterspell",
      "name": "Improved Counterspell",
      "tree": "arcane",
      "row": 4,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        11255,
        12598
      ],
      "icon": "spell_frost_iceshock"
    },
    {
      "id": "arcaneMeditation",
      "name": "Arcane Meditation",
      "tree": "arcane",
      "row": 4,
      "column": 4,
      "maxRank": 3,
      "spellIds": [
        18462,
        18463,
        18464
      ],
      "icon": "spell_shadow_siphonmana"
    },
    {
      "id": "presenceOfMind",
      "name": "Presence of Mind",
      "tree": "arcane",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12043
      ],
      "icon": "spell_nature_enchantarmor"
    },
    {
      "id": "arcaneMind",
      "name": "Arcane Mind",
      "tree": "arcane",
      "row": 5,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        11232,
        12500,
        12501,
        12502,
        12503
      ],
      "icon": "spell_shadow_charm",
      "prerequisite": "arcaneResilience"
    },
    {
      "id": "arcaneInstability",
      "name": "Arcane Instability",
      "tree": "arcane",
      "row": 6,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        15058,
        15059,
        15060
      ],
      "icon": "spell_shadow_teleport",
      "prerequisite": "presenceOfMind"
    },
    {
      "id": "arcanePower",
      "name": "Arcane Power",
      "tree": "arcane",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12042
      ],
      "icon": "spell_nature_lightning",
      "prerequisite": "arcaneInstability"
    },
    {
      "id": "improvedFireball",
      "name": "Improved Fireball",
      "tree": "fire",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        11069,
        12338,
        12339,
        12340,
        12341
      ],
      "icon": "spell_fire_flamebolt"
    },
    {
      "id": "impact",
      "name": "Impact",
      "tree": "fire",
      "row": 1,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        11103,
        12357,
        12358,
        12359,
        12360
      ],
      "icon": "spell_fire_meteorstorm"
    },
    {
      "id": "ignite",
      "name": "Ignite",
      "tree": "fire",
      "row": 2,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        11119,
        11120,
        12846,
        12847,
        12848
      ],
      "icon": "spell_fire_incinerate"
    },
    {
      "id": "flameThrowing",
      "name": "Flame Throwing",
      "tree": "fire",
      "row": 2,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        11100,
        12353
      ],
      "icon": "spell_fire_flare"
    },
    {
      "id": "improvedFireBlast",
      "name": "Improved Fire Blast",
      "tree": "fire",
      "row": 2,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        11078,
        11080,
        12342
      ],
      "icon": "spell_fire_fireball"
    },
    {
      "id": "incinerate",
      "name": "Incinerate",
      "tree": "fire",
      "row": 3,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        18459,
        18460
      ],
      "icon": "spell_fire_flameshock"
    },
    {
      "id": "improvedFlamestrike",
      "name": "Improved Flamestrike",
      "tree": "fire",
      "row": 3,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        11108,
        12349,
        12350
      ],
      "icon": "spell_fire_selfdestruct"
    },
    {
      "id": "pyroblast",
      "name": "Pyroblast",
      "tree": "fire",
      "row": 3,
      "column": 3,
      "maxRank": 1,
      "spellIds": [
        11366
      ],
      "icon": "spell_fire_fireball02"
    },
    {
      "id": "burningSoul",
      "name": "Burning Soul",
      "tree": "fire",
      "row": 3,
      "column": 4,
      "maxRank": 2,
      "spellIds": [
        11083,
        12351
      ],
      "icon": "spell_fire_fire"
    },
    {
      "id": "improvedScorch",
      "name": "Improved Scorch",
      "tree": "fire",
      "row": 4,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        11095,
        12872,
        12873
      ],
      "icon": "spell_fire_soulburn"
    },
    {
      "id": "improvedFireWard",
      "name": "Improved Fire Ward",
      "tree": "fire",
      "row": 4,
      "column": 2,
      "maxRank": 2,
      "spellIds": [
        11094,
        13043
      ],
      "icon": "spell_fire_firearmor"
    },
    {
      "id": "masterOfElements",
      "name": "Master of Elements",
      "tree": "fire",
      "row": 4,
      "column": 4,
      "maxRank": 3,
      "spellIds": [
        29074,
        29075,
        29076
      ],
      "icon": "spell_fire_masterofelements"
    },
    {
      "id": "criticalMass",
      "name": "Critical Mass",
      "tree": "fire",
      "row": 5,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        11115,
        11367,
        11368
      ],
      "icon": "spell_nature_wispheal"
    },
    {
      "id": "blastWave",
      "name": "Blast Wave",
      "tree": "fire",
      "row": 5,
      "column": 3,
      "maxRank": 1,
      "spellIds": [
        11113
      ],
      "icon": "spell_holy_excorcism_02",
      "prerequisite": "pyroblast"
    },
    {
      "id": "firePower",
      "name": "Fire Power",
      "tree": "fire",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        11124,
        12378,
        12398,
        12399,
        12400
      ],
      "icon": "spell_fire_immolation"
    },
    {
      "id": "combustion",
      "name": "Combustion",
      "tree": "fire",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        11129
      ],
      "icon": "spell_fire_sealoffire",
      "prerequisite": "criticalMass"
    },
    {
      "id": "frostWarding",
      "name": "Frost Warding",
      "tree": "frost",
      "row": 1,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        11189,
        28332
      ],
      "icon": "spell_frost_frostward"
    },
    {
      "id": "improvedFrostbolt",
      "name": "Improved Frostbolt",
      "tree": "frost",
      "row": 1,
      "column": 2,
      "maxRank": 5,
      "spellIds": [
        11070,
        12473,
        16763,
        16765,
        16766
      ],
      "icon": "spell_frost_frostbolt02"
    },
    {
      "id": "elementalPrecision",
      "name": "Elemental Precision",
      "tree": "frost",
      "row": 1,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        29438,
        29439,
        29440
      ],
      "icon": "spell_ice_magicdamage"
    },
    {
      "id": "iceShards",
      "name": "Ice Shards",
      "tree": "frost",
      "row": 2,
      "column": 1,
      "maxRank": 5,
      "spellIds": [
        11207,
        12672,
        15047,
        15052,
        15053
      ],
      "icon": "spell_frost_iceshard"
    },
    {
      "id": "frostbite",
      "name": "Frostbite",
      "tree": "frost",
      "row": 2,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        11071,
        12496,
        12497
      ],
      "icon": "spell_frost_frostarmor"
    },
    {
      "id": "improvedFrostNova",
      "name": "Improved Frost Nova",
      "tree": "frost",
      "row": 2,
      "column": 3,
      "maxRank": 2,
      "spellIds": [
        11165,
        12475
      ],
      "icon": "spell_frost_freezingbreath"
    },
    {
      "id": "permafrost",
      "name": "Permafrost",
      "tree": "frost",
      "row": 2,
      "column": 4,
      "maxRank": 3,
      "spellIds": [
        11175,
        12569,
        12571
      ],
      "icon": "spell_frost_wisp"
    },
    {
      "id": "piercingIce",
      "name": "Piercing Ice",
      "tree": "frost",
      "row": 3,
      "column": 1,
      "maxRank": 3,
      "spellIds": [
        11151,
        12952,
        12953
      ],
      "icon": "spell_frost_frostbolt"
    },
    {
      "id": "coldSnap",
      "name": "Cold Snap",
      "tree": "frost",
      "row": 3,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        12472
      ],
      "icon": "spell_frost_wizardmark"
    },
    {
      "id": "improvedBlizzard",
      "name": "Improved Blizzard",
      "tree": "frost",
      "row": 3,
      "column": 4,
      "maxRank": 3,
      "spellIds": [
        11185,
        12487,
        12488
      ],
      "icon": "spell_frost_icestorm"
    },
    {
      "id": "arcticReach",
      "name": "Arctic Reach",
      "tree": "frost",
      "row": 4,
      "column": 1,
      "maxRank": 2,
      "spellIds": [
        16757,
        16758
      ],
      "icon": "spell_shadow_darkritual"
    },
    {
      "id": "frostChanneling",
      "name": "Frost Channeling",
      "tree": "frost",
      "row": 4,
      "column": 2,
      "maxRank": 3,
      "spellIds": [
        11160,
        12518,
        12519
      ],
      "icon": "spell_frost_stun"
    },
    {
      "id": "shatter",
      "name": "Shatter",
      "tree": "frost",
      "row": 4,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        11170,
        12982,
        12983,
        12984,
        12985
      ],
      "icon": "spell_frost_frostshock",
      "prerequisite": "improvedFrostNova"
    },
    {
      "id": "iceBlock",
      "name": "Ice Block",
      "tree": "frost",
      "row": 5,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        11958
      ],
      "icon": "spell_frost_frost"
    },
    {
      "id": "improvedConeOfCold",
      "name": "Improved Cone of Cold",
      "tree": "frost",
      "row": 5,
      "column": 3,
      "maxRank": 3,
      "spellIds": [
        11190,
        12489,
        12490
      ],
      "icon": "spell_frost_glacier"
    },
    {
      "id": "wintersChill",
      "name": "Winter's Chill",
      "tree": "frost",
      "row": 6,
      "column": 3,
      "maxRank": 5,
      "spellIds": [
        11180,
        28592,
        28593,
        28594,
        28595
      ],
      "icon": "spell_frost_chillingblast"
    },
    {
      "id": "iceBarrier",
      "name": "Ice Barrier",
      "tree": "frost",
      "row": 7,
      "column": 2,
      "maxRank": 1,
      "spellIds": [
        11426
      ],
      "icon": "spell_ice_lament",
      "prerequisite": "iceBlock"
    }
  ],
  "source": "https://github.com/wowsims/classic/blob/c925c1184dcd0c5eaff2d128af899be639235b63/ui/core/talents/trees/mage.json"
};

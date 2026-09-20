// Observed Vanilla metadata; standard Era S0 verified against live rankings.
export const ERA_PARTITION = { id: 1, name: "S0" } as const;
export const ERA_REGISTRY_REVISION = "era-s0-observed-v1";
export const ERA_RAIDS = [
  {
    "id": 2006,
    "name": "Naxxramas",
    "returnedOrder": 0,
    "order": 6,
    "partitions": [
      {
        "id": 1,
        "name": "S0",
        "compactName": "S0",
        "default": true
      },
      {
        "id": 2,
        "name": "S0 (Without World Buffs)",
        "compactName": "S0 (No WB)",
        "default": false
      },
      {
        "id": 3,
        "name": "SoM P1 & P2",
        "compactName": "SoM P1 & P2",
        "default": false
      },
      {
        "id": 4,
        "name": "SoM P3 & P4",
        "compactName": "SoM P3 & P4",
        "default": false
      },
      {
        "id": 5,
        "name": "SoM P5",
        "compactName": "SoM P5",
        "default": false
      },
      {
        "id": 6,
        "name": "SoM P6",
        "compactName": "SoM P6",
        "default": false
      },
      {
        "id": 7,
        "name": "Hardcore",
        "compactName": "HC",
        "default": false
      },
      {
        "id": 8,
        "name": "Hardcore (Fresh)",
        "compactName": "HC2",
        "default": false
      },
      {
        "id": 9,
        "name": "Hardcore (Fresh P2)",
        "compactName": "HC2P2",
        "default": false
      },
      {
        "id": 10,
        "name": "Hardcore (Fresh P3)",
        "compactName": "HC2P3",
        "default": false
      },
      {
        "id": 11,
        "name": "Hardcore (Fresh P4)",
        "compactName": "HC2P4",
        "default": false
      }
    ],
    "encounters": [
      {
        "id": 51118,
        "name": "Patchwerk",
        "order": 0,
        "progression": true
      },
      {
        "id": 51111,
        "name": "Grobbulus",
        "order": 1,
        "progression": true
      },
      {
        "id": 51108,
        "name": "Gluth",
        "order": 2,
        "progression": true
      },
      {
        "id": 51120,
        "name": "Thaddius",
        "order": 3,
        "progression": true
      },
      {
        "id": 51117,
        "name": "Noth the Plaguebringer",
        "order": 4,
        "progression": true
      },
      {
        "id": 51112,
        "name": "Heigan the Unclean",
        "order": 5,
        "progression": true
      },
      {
        "id": 51115,
        "name": "Loatheb",
        "order": 6,
        "progression": true
      },
      {
        "id": 51107,
        "name": "Anub'Rekhan",
        "order": 7,
        "progression": true
      },
      {
        "id": 51110,
        "name": "Grand Widow Faerlina",
        "order": 8,
        "progression": true
      },
      {
        "id": 51116,
        "name": "Maexxna",
        "order": 9,
        "progression": true
      },
      {
        "id": 51113,
        "name": "Instructor Razuvious",
        "order": 10,
        "progression": true
      },
      {
        "id": 51109,
        "name": "Gothik the Harvester",
        "order": 11,
        "progression": true
      },
      {
        "id": 51121,
        "name": "The Four Horsemen",
        "order": 12,
        "progression": true
      },
      {
        "id": 51119,
        "name": "Sapphiron",
        "order": 13,
        "progression": true
      },
      {
        "id": 51114,
        "name": "Kel'Thuzad",
        "order": 14,
        "progression": true
      }
    ]
  },
  {
    "id": 2005,
    "name": "Temple of Ahn'Qiraj",
    "returnedOrder": 1,
    "order": 5,
    "partitions": [
      {
        "id": 1,
        "name": "S0",
        "compactName": "S0",
        "default": true
      },
      {
        "id": 2,
        "name": "S0 (Without World Buffs)",
        "compactName": "S0 (No WB)",
        "default": false
      },
      {
        "id": 3,
        "name": "SoM P1 & P2",
        "compactName": "SoM P1 & P2",
        "default": false
      },
      {
        "id": 4,
        "name": "SoM P3 & P4",
        "compactName": "SoM P3 & P4",
        "default": false
      },
      {
        "id": 5,
        "name": "SoM P5",
        "compactName": "SoM P5",
        "default": false
      },
      {
        "id": 6,
        "name": "SoM P6",
        "compactName": "SoM P6",
        "default": false
      },
      {
        "id": 7,
        "name": "Hardcore",
        "compactName": "HC",
        "default": false
      },
      {
        "id": 8,
        "name": "Hardcore (Fresh)",
        "compactName": "HC2",
        "default": false
      },
      {
        "id": 9,
        "name": "Hardcore (Fresh P2)",
        "compactName": "HC2P2",
        "default": false
      },
      {
        "id": 10,
        "name": "Hardcore (Fresh P3)",
        "compactName": "HC2P3",
        "default": false
      },
      {
        "id": 11,
        "name": "Hardcore (Fresh P4)",
        "compactName": "HC2P4",
        "default": false
      }
    ],
    "encounters": [
      {
        "id": 50709,
        "name": "The Prophet Skeram",
        "order": 0,
        "progression": true
      },
      {
        "id": 50710,
        "name": "Silithid Royalty",
        "order": 1,
        "progression": true
      },
      {
        "id": 50711,
        "name": "Battleguard Sartura",
        "order": 2,
        "progression": true
      },
      {
        "id": 50712,
        "name": "Fankriss the Unyielding",
        "order": 3,
        "progression": true
      },
      {
        "id": 50713,
        "name": "Viscidus",
        "order": 4,
        "progression": true
      },
      {
        "id": 50714,
        "name": "Princess Huhuran",
        "order": 5,
        "progression": true
      },
      {
        "id": 50715,
        "name": "Twin Emperors",
        "order": 6,
        "progression": true
      },
      {
        "id": 50716,
        "name": "Ouro",
        "order": 7,
        "progression": true
      },
      {
        "id": 50717,
        "name": "C'Thun",
        "order": 8,
        "progression": true
      }
    ]
  },
  {
    "id": 2004,
    "name": "Ruins of Ahn'Qiraj",
    "returnedOrder": 2,
    "order": 4,
    "partitions": [
      {
        "id": 1,
        "name": "S0",
        "compactName": "S0",
        "default": true
      },
      {
        "id": 2,
        "name": "S0 (Without World Buffs)",
        "compactName": "S0 (No WB)",
        "default": false
      },
      {
        "id": 3,
        "name": "SoM P1 & P2",
        "compactName": "SoM P1 & P2",
        "default": false
      },
      {
        "id": 4,
        "name": "SoM P3 & P4",
        "compactName": "SoM P3 & P4",
        "default": false
      },
      {
        "id": 5,
        "name": "SoM P5",
        "compactName": "SoM P5",
        "default": false
      },
      {
        "id": 6,
        "name": "SoM P6",
        "compactName": "SoM P6",
        "default": false
      },
      {
        "id": 7,
        "name": "Hardcore",
        "compactName": "HC",
        "default": false
      },
      {
        "id": 8,
        "name": "Hardcore (Fresh)",
        "compactName": "HC2",
        "default": false
      },
      {
        "id": 9,
        "name": "Hardcore (Fresh P2)",
        "compactName": "HC2P2",
        "default": false
      },
      {
        "id": 10,
        "name": "Hardcore (Fresh P3)",
        "compactName": "HC2P3",
        "default": false
      },
      {
        "id": 11,
        "name": "Hardcore (Fresh P4)",
        "compactName": "HC2P4",
        "default": false
      }
    ],
    "encounters": [
      {
        "id": 50718,
        "name": "Kurinnaxx",
        "order": 0,
        "progression": true
      },
      {
        "id": 50719,
        "name": "General Rajaxx",
        "order": 1,
        "progression": true
      },
      {
        "id": 50720,
        "name": "Moam",
        "order": 2,
        "progression": true
      },
      {
        "id": 50721,
        "name": "Buru the Gorger",
        "order": 3,
        "progression": true
      },
      {
        "id": 50722,
        "name": "Ayamiss the Hunter",
        "order": 4,
        "progression": true
      },
      {
        "id": 50723,
        "name": "Ossirian the Unscarred",
        "order": 5,
        "progression": true
      }
    ]
  },
  {
    "id": 2003,
    "name": "Zul'Gurub",
    "returnedOrder": 3,
    "order": 3,
    "partitions": [
      {
        "id": 1,
        "name": "S0",
        "compactName": "S0",
        "default": true
      },
      {
        "id": 2,
        "name": "S0 (Without World Buffs)",
        "compactName": "S0 (No WB)",
        "default": false
      },
      {
        "id": 3,
        "name": "SoM P1 & P2",
        "compactName": "SoM P1 & P2",
        "default": false
      },
      {
        "id": 4,
        "name": "SoM P3 & P4",
        "compactName": "SoM P3 & P4",
        "default": false
      },
      {
        "id": 5,
        "name": "SoM P5",
        "compactName": "SoM P5",
        "default": false
      },
      {
        "id": 6,
        "name": "SoM P6",
        "compactName": "SoM P6",
        "default": false
      },
      {
        "id": 7,
        "name": "Hardcore",
        "compactName": "HC",
        "default": false
      },
      {
        "id": 8,
        "name": "Hardcore (Fresh)",
        "compactName": "HC2",
        "default": false
      },
      {
        "id": 9,
        "name": "Hardcore (Fresh P2)",
        "compactName": "HC2P2",
        "default": false
      },
      {
        "id": 10,
        "name": "Hardcore (Fresh P3)",
        "compactName": "HC2P3",
        "default": false
      },
      {
        "id": 11,
        "name": "Hardcore (Fresh P4)",
        "compactName": "HC2P4",
        "default": false
      }
    ],
    "encounters": [
      {
        "id": 50784,
        "name": "High Priest Venoxis",
        "order": 0,
        "progression": true
      },
      {
        "id": 50785,
        "name": "High Priestess Jeklik",
        "order": 1,
        "progression": true
      },
      {
        "id": 50786,
        "name": "High Priestess Mar'li",
        "order": 2,
        "progression": true
      },
      {
        "id": 50787,
        "name": "Bloodlord Mandokir",
        "order": 3,
        "progression": true
      },
      {
        "id": 50788,
        "name": "Edge of Madness",
        "order": 4,
        "progression": false,
        "exclusionReason": "Optional summoned encounter"
      },
      {
        "id": 50789,
        "name": "High Priest Thekal",
        "order": 5,
        "progression": true
      },
      {
        "id": 50790,
        "name": "Gahz'ranka",
        "order": 6,
        "progression": false,
        "exclusionReason": "Optional summoned encounter"
      },
      {
        "id": 50791,
        "name": "High Priestess Arlokk",
        "order": 7,
        "progression": true
      },
      {
        "id": 50792,
        "name": "Jin'do the Hexxer",
        "order": 8,
        "progression": true
      },
      {
        "id": 50793,
        "name": "Hakkar",
        "order": 9,
        "progression": true
      },
      {
        "id": 50794,
        "name": "Hakkar (Hard Mode)",
        "order": 10,
        "progression": false,
        "exclusionReason": "Alternate hard mode"
      }
    ]
  },
  {
    "id": 2002,
    "name": "Blackwing Lair",
    "returnedOrder": 4,
    "order": 2,
    "partitions": [
      {
        "id": 1,
        "name": "S0",
        "compactName": "S0",
        "default": true
      },
      {
        "id": 2,
        "name": "S0 (Without World Buffs)",
        "compactName": "S0 (No WB)",
        "default": false
      },
      {
        "id": 3,
        "name": "SoM P1 & P2",
        "compactName": "SoM P1 & P2",
        "default": false
      },
      {
        "id": 4,
        "name": "SoM P3 & P4",
        "compactName": "SoM P3 & P4",
        "default": false
      },
      {
        "id": 5,
        "name": "SoM P5",
        "compactName": "SoM P5",
        "default": false
      },
      {
        "id": 6,
        "name": "SoM P6",
        "compactName": "SoM P6",
        "default": false
      },
      {
        "id": 7,
        "name": "Hardcore",
        "compactName": "HC",
        "default": false
      },
      {
        "id": 8,
        "name": "Hardcore (Fresh)",
        "compactName": "HC2",
        "default": false
      },
      {
        "id": 9,
        "name": "Hardcore (Fresh P2)",
        "compactName": "HC2P2",
        "default": false
      },
      {
        "id": 10,
        "name": "Hardcore (Fresh P3)",
        "compactName": "HC2P3",
        "default": false
      },
      {
        "id": 11,
        "name": "Hardcore (Fresh P4)",
        "compactName": "HC2P4",
        "default": false
      }
    ],
    "encounters": [
      {
        "id": 50610,
        "name": "Razorgore the Untamed",
        "order": 0,
        "progression": true
      },
      {
        "id": 50611,
        "name": "Vaelastrasz the Corrupt",
        "order": 1,
        "progression": true
      },
      {
        "id": 50612,
        "name": "Broodlord Lashlayer",
        "order": 2,
        "progression": true
      },
      {
        "id": 50613,
        "name": "Firemaw",
        "order": 3,
        "progression": true
      },
      {
        "id": 50614,
        "name": "Ebonroc",
        "order": 4,
        "progression": true
      },
      {
        "id": 50615,
        "name": "Flamegor",
        "order": 5,
        "progression": true
      },
      {
        "id": 50616,
        "name": "Chromaggus",
        "order": 6,
        "progression": true
      },
      {
        "id": 50617,
        "name": "Nefarian",
        "order": 7,
        "progression": true
      },
      {
        "id": 50631,
        "name": "Ebonroc / Flamegor",
        "order": 8,
        "progression": false,
        "exclusionReason": "Combined alternate encounter"
      }
    ]
  },
  {
    "id": 2001,
    "name": "Onyxia",
    "returnedOrder": 5,
    "order": 1,
    "partitions": [
      {
        "id": 1,
        "name": "S0",
        "compactName": "S0",
        "default": true
      },
      {
        "id": 2,
        "name": "S0 (Without World Buffs)",
        "compactName": "S0 (No WB)",
        "default": false
      },
      {
        "id": 3,
        "name": "SoM P1 & P2",
        "compactName": "SoM P1 & P2",
        "default": false
      },
      {
        "id": 4,
        "name": "SoM P3 & P4",
        "compactName": "SoM P3 & P4",
        "default": false
      },
      {
        "id": 5,
        "name": "SoM P5",
        "compactName": "SoM P5",
        "default": false
      },
      {
        "id": 6,
        "name": "SoM P6",
        "compactName": "SoM P6",
        "default": false
      },
      {
        "id": 7,
        "name": "Hardcore",
        "compactName": "HC",
        "default": false
      },
      {
        "id": 8,
        "name": "Hardcore (Fresh)",
        "compactName": "HC2",
        "default": false
      },
      {
        "id": 9,
        "name": "Hardcore (Fresh P2)",
        "compactName": "HC2P2",
        "default": false
      },
      {
        "id": 10,
        "name": "Hardcore (Fresh P3)",
        "compactName": "HC2P3",
        "default": false
      },
      {
        "id": 11,
        "name": "Hardcore (Fresh P4)",
        "compactName": "HC2P4",
        "default": false
      }
    ],
    "encounters": [
      {
        "id": 51084,
        "name": "Onyxia",
        "order": 0,
        "progression": true
      }
    ]
  },
  {
    "id": 2000,
    "name": "Molten Core",
    "returnedOrder": 6,
    "order": 0,
    "partitions": [
      {
        "id": 1,
        "name": "S0",
        "compactName": "S0",
        "default": true
      },
      {
        "id": 2,
        "name": "S0 (Without World Buffs)",
        "compactName": "S0 (No WB)",
        "default": false
      },
      {
        "id": 3,
        "name": "SoM P1 & P2",
        "compactName": "SoM P1 & P2",
        "default": false
      },
      {
        "id": 4,
        "name": "SoM P3 & P4",
        "compactName": "SoM P3 & P4",
        "default": false
      },
      {
        "id": 5,
        "name": "SoM P5",
        "compactName": "SoM P5",
        "default": false
      },
      {
        "id": 6,
        "name": "SoM P6",
        "compactName": "SoM P6",
        "default": false
      },
      {
        "id": 7,
        "name": "Hardcore",
        "compactName": "HC",
        "default": false
      },
      {
        "id": 8,
        "name": "Hardcore (Fresh)",
        "compactName": "HC2",
        "default": false
      },
      {
        "id": 9,
        "name": "Hardcore (Fresh P2)",
        "compactName": "HC2P2",
        "default": false
      },
      {
        "id": 10,
        "name": "Hardcore (Fresh P3)",
        "compactName": "HC2P3",
        "default": false
      },
      {
        "id": 11,
        "name": "Hardcore (Fresh P4)",
        "compactName": "HC2P4",
        "default": false
      }
    ],
    "encounters": [
      {
        "id": 50663,
        "name": "Lucifron",
        "order": 0,
        "progression": true
      },
      {
        "id": 50664,
        "name": "Magmadar",
        "order": 1,
        "progression": true
      },
      {
        "id": 50665,
        "name": "Gehennas",
        "order": 2,
        "progression": true
      },
      {
        "id": 50666,
        "name": "Garr",
        "order": 3,
        "progression": true
      },
      {
        "id": 50667,
        "name": "Shazzrah",
        "order": 4,
        "progression": true
      },
      {
        "id": 50668,
        "name": "Baron Geddon",
        "order": 5,
        "progression": true
      },
      {
        "id": 50669,
        "name": "Sulfuron Harbinger",
        "order": 6,
        "progression": true
      },
      {
        "id": 50670,
        "name": "Golemagg the Incinerator",
        "order": 7,
        "progression": true
      },
      {
        "id": 50671,
        "name": "Majordomo Executus",
        "order": 8,
        "progression": true
      },
      {
        "id": 50672,
        "name": "Ragnaros",
        "order": 9,
        "progression": true
      }
    ]
  }
] as const;

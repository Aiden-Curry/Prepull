import type { GuideTalentBuild } from "./types.ts";
// Representative allocations decoded from the reviewed Classic guide calculator links.
export const frostGuideBuilds: readonly GuideTalentBuild[] = [
  {
    "id": "era-frost-arcane-power",
    "classId": "era-mage",
    "name": "Arcane Power Frost",
    "selectedRanks": {
      "arcaneSubtlety": 2,
      "arcaneFocus": 3,
      "arcaneConcentration": 5,
      "magicAbsorption": 4,
      "improvedArcaneExplosion": 3,
      "arcaneResilience": 1,
      "arcaneMeditation": 3,
      "presenceOfMind": 1,
      "arcaneMind": 5,
      "arcaneInstability": 3,
      "arcanePower": 1,
      "improvedFrostbolt": 5,
      "elementalPrecision": 3,
      "iceShards": 5,
      "piercingIce": 3,
      "arcticReach": 1,
      "frostChanneling": 3
    },
    "expectedAllocation": [
      31,
      0,
      20
    ],
    "source": "https://www.icy-veins.com/wow-classic/mage-dps-pve-spec-builds-talents#arcane-power-frost-mage-talent-build"
  },
  {
    "id": "era-frost-winters-chill",
    "classId": "era-mage",
    "name": "Winter's Chill support Frost",
    "selectedRanks": {
      "improvedFrostbolt": 5,
      "elementalPrecision": 3,
      "iceShards": 5,
      "permafrost": 3,
      "piercingIce": 3,
      "coldSnap": 1,
      "improvedBlizzard": 3,
      "arcticReach": 2,
      "frostChanneling": 3,
      "iceBlock": 1,
      "wintersChill": 5,
      "iceBarrier": 1,
      "arcaneSubtlety": 2,
      "arcaneFocus": 3,
      "magicAbsorption": 1,
      "arcaneConcentration": 5,
      "arcaneResilience": 1,
      "improvedArcaneExplosion": 3,
      "arcaneMeditation": 1
    },
    "expectedAllocation": [
      16,
      0,
      35
    ],
    "source": "https://www.icy-veins.com/wow-classic/mage-dps-pve-spec-builds-talents#winters-chill-frost-mage-talent-builds"
  }
];

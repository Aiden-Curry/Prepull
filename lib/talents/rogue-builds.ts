import type { GuideTalentBuild } from "./types.ts";
// Exact representative Classic raid allocations from the reviewed calculator links.
export const combatGuideBuilds: readonly GuideTalentBuild[] = [
  {
    "id": "era-combat-swords",
    "classId": "era-rogue",
    "name": "Combat Swords",
    "selectedRanks": {
      "malice": 5,
      "murder": 2,
      "ruthlessness": 3,
      "improvedSliceAndDice": 3,
      "relentlessStrikes": 1,
      "lethality": 5,
      "improvedGouge": 3,
      "improvedSinisterStrike": 2,
      "lightningReflexes": 1,
      "precision": 5,
      "endurance": 2,
      "improvedSprint": 2,
      "dualWieldSpecialization": 5,
      "bladeFlurry": 1,
      "swordSpecialization": 5,
      "aggression": 3,
      "weaponExpertise": 2,
      "adrenalineRush": 1
    },
    "expectedAllocation": [
      19,
      32,
      0
    ],
    "source": "https://www.icy-veins.com/wow-classic/rogue-dps-pve-spec-builds-talents#combat-sword-build"
  },
  {
    "id": "era-combat-daggers",
    "classId": "era-rogue",
    "name": "Combat Daggers",
    "selectedRanks": {
      "malice": 5,
      "murder": 2,
      "improvedSliceAndDice": 3,
      "lethality": 5,
      "improvedGouge": 3,
      "improvedSinisterStrike": 2,
      "improvedBackstab": 3,
      "precision": 5,
      "endurance": 2,
      "improvedSprint": 2,
      "daggerSpecialization": 5,
      "dualWieldSpecialization": 5,
      "bladeFlurry": 1,
      "weaponExpertise": 2,
      "adrenalineRush": 1,
      "opportunity": 5
    },
    "expectedAllocation": [
      15,
      31,
      5
    ],
    "source": "https://www.icy-veins.com/wow-classic/rogue-dps-pve-spec-builds-talents#combat-dagger-build"
  }
];

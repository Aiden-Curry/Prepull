import type { GuideTalentBuild } from "./types.ts";
// Exact representative Classic raid allocations from the reviewed calculator links.
export const marksmanshipGuideBuilds: readonly GuideTalentBuild[] = [
  {
    "id": "era-marksmanship-standard",
    "classId": "era-hunter",
    "name": "Standard raid Marksmanship",
    "selectedRanks": {
      "efficiency": 5,
      "lethalShots": 5,
      "hawkEye": 3,
      "aimedShot": 1,
      "improvedHuntersMark": 3,
      "mortalShots": 5,
      "barrage": 3,
      "rangedWeaponSpecialization": 5,
      "trueshotAura": 1,
      "improvedAspectOfTheHawk": 5,
      "improvedRevivePet": 2,
      "thickHide": 3,
      "unleashedFury": 5,
      "ferocity": 5
    },
    "expectedAllocation": [
      20,
      31,
      0
    ],
    "source": "https://www.icy-veins.com/wow-classic/hunter-dps-pve-spec-builds-talents#marksmanship-standard-raiding-talent-build"
  },
  {
    "id": "era-marksmanship-surefooted",
    "classId": "era-hunter",
    "name": "Marksmanship with Surefooted",
    "selectedRanks": {
      "efficiency": 5,
      "lethalShots": 5,
      "hawkEye": 3,
      "aimedShot": 1,
      "improvedHuntersMark": 3,
      "mortalShots": 5,
      "barrage": 3,
      "rangedWeaponSpecialization": 5,
      "trueshotAura": 1,
      "monsterSlaying": 3,
      "humanoidSlaying": 3,
      "savageStrikes": 2,
      "entrapment": 2,
      "cleverTraps": 2,
      "survivalist": 3,
      "surefooted": 3,
      "improvedAspectOfTheHawk": 2
    },
    "expectedAllocation": [
      2,
      31,
      18
    ],
    "source": "https://www.icy-veins.com/wow-classic/hunter-dps-pve-spec-builds-talents#marksmanship-survival-raiding-talent-build"
  }
];

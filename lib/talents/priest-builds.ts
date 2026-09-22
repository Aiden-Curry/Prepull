import type { GuideTalentBuild } from "./types.ts";
// Exact representative Classic raid allocations from the reviewed calculator links.
export const holyGuideBuilds: readonly GuideTalentBuild[] = [
  {
    "id": "era-holy-standard",
    "classId": "era-priest",
    "name": "Standard Holy raid healing",
    "selectedRanks": {
      "holySpecialization": 5,
      "divineFury": 5,
      "healingFocus": 2,
      "inspiration": 3,
      "improvedHealing": 3,
      "holyNova": 1,
      "spellWarding": 1,
      "spiritualGuidance": 5,
      "spiritualHealing": 5,
      "unbreakableWill": 5,
      "improvedPowerWordFortitude": 2,
      "silentResolve": 4,
      "innerFocus": 1,
      "meditation": 3,
      "mentalAgility": 5,
      "divineSpirit": 1
    },
    "expectedAllocation": [
      21,
      30,
      0
    ],
    "source": "https://www.icy-veins.com/wow-classic/priest-healer-pve-spec-builds-talents#holy-priest-talent-build"
  },
  {
    "id": "era-holy-power-infusion",
    "classId": "era-priest",
    "name": "Power Infusion healing alternative",
    "selectedRanks": {
      "unbreakableWill": 5,
      "improvedPowerWordFortitude": 2,
      "improvedPowerWordShield": 3,
      "meditation": 3,
      "innerFocus": 1,
      "silentResolve": 1,
      "mentalAgility": 5,
      "divineSpirit": 1,
      "mentalStrength": 5,
      "forceOfWill": 5,
      "powerInfusion": 1,
      "holySpecialization": 5,
      "divineFury": 5,
      "inspiration": 3,
      "healingFocus": 2,
      "improvedHealing": 3,
      "holyNova": 1
    },
    "expectedAllocation": [
      32,
      19,
      0
    ],
    "source": "https://www.icy-veins.com/wow-classic/priest-healer-pve-spec-builds-talents#discipline-priest-talent-build"
  }
];

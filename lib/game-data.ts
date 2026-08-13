import { ContentVersion, GameConfig } from "./types";

export const gameVersions: Record<ContentVersion, GameConfig> = {
  era: {
    name: "Classic Era", shortName: "ERA", tagline: "The original adventure, prepared with intent.",
    raids: [
      { name: "Molten Core", location: "Blackrock Mountain", level: "60", bosses: 10, accent: "red" },
      { name: "Blackwing Lair", location: "Blackrock Mountain", level: "60", bosses: 8, accent: "gold" },
      { name: "Zul'Gurub", location: "Stranglethorn Vale", level: "60", bosses: 9, accent: "purple" },
      { name: "Ahn'Qiraj", location: "Silithus", level: "60", bosses: 9, accent: "blue" },
      { name: "Naxxramas", location: "Eastern Plaguelands", level: "60", bosses: 15, accent: "green" },
    ],
    classes: ["Warrior", "Paladin", "Hunter", "Rogue", "Priest", "Shaman", "Mage", "Warlock", "Druid"].map((name, i) => ({ name, role: ["Tank", "Support", "Ranged", "Melee"][i % 4], initials: name.slice(0, 2).toUpperCase(), tone: (["gold", "red", "green", "purple"] as const)[i % 4] })),
    tools: [{ name: "Character Check", description: "Find meaningful upgrades for your character.", icon: "✦", featured: true }, { name: "Raid Builder", description: "Plan your raid composition and important buffs.", icon: "⌘" }, { name: "Gear Planner", description: "Build a realistic path towards your best gear.", icon: "◈" }, { name: "Guild Tools", description: "Organise your roster, raids and progression.", icon: "♙" }]
  },
  tbc: {
    name: "The Burning Crusade", shortName: "TBC", tagline: "Step through the portal, ready for anything.",
    raids: ["Karazhan", "Gruul's Lair", "Magtheridon's Lair", "Serpentshrine Cavern", "Tempest Keep", "Mount Hyjal", "Black Temple"].map((name, i) => ({ name, location: ["Deadwind Pass", "Blade's Edge Mountains", "Hellfire Peninsula", "Zangarmarsh", "Netherstorm", "Caverns of Time", "Shadowmoon Valley"][i], level: "70", bosses: [11, 2, 1, 6, 4, 5, 9][i], accent: (["purple", "green", "red", "blue"] as const)[i % 4] })),
    classes: ["Warrior", "Paladin", "Hunter", "Rogue", "Priest", "Shaman", "Mage", "Warlock", "Druid"].map((name, i) => ({ name, role: ["Tank", "Support", "Ranged", "Melee"][i % 4], initials: name.slice(0, 2).toUpperCase(), tone: (["green", "purple", "gold", "blue"] as const)[i % 4] })),
    tools: [{ name: "Character Check", description: "Find meaningful upgrades for your character.", icon: "✦", featured: true }, { name: "Raid Builder", description: "Plan your raid composition and important buffs.", icon: "⌘" }, { name: "Gear Planner", description: "Build a realistic path towards your best gear.", icon: "◈" }, { name: "Attunement Tracker", description: "Keep every key attunement on the right path.", icon: "⚿", featured: true }, { name: "Reputation Tracker", description: "Know which factions unlock your next upgrade.", icon: "✧" }, { name: "Guild Tools", description: "Organise your roster, raids and progression.", icon: "♙" }]
  }
};

export function isContentVersion(value: string): value is ContentVersion { return value === "era" || value === "tbc"; }
/** @deprecated Use isContentVersion for content routing. */
export const isGameVersion = isContentVersion;

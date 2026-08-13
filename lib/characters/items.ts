import { CharacterSource, EquippedItem, EquipmentSlot, ItemQuality } from "../types";

export const source = (type: CharacterSource["type"], details: Omit<CharacterSource, "type">): CharacterSource => ({ type, ...details });
export function item(itemId: number, name: string, slot: EquipmentSlot, quality: ItemQuality, stats: Record<string, string>, itemLevel?: number, itemSource?: CharacterSource): EquippedItem { return { itemId, name, slot, quality, stats, itemLevel, icon: slot.split(" ").map((part) => part[0]).join("").slice(0, 2), source: itemSource }; }

export const eraItems = {
  helm: item(16963, "Bloodfang Hood", "Head", "Epic", { Agility: "+20", Stamina: "+19", "Set bonus": "Bloodfang" }, 76, source("Raid", { instance: "Blackwing Lair", boss: "Nefarian", difficulty: "Raid" })),
  shoulders: item(16832, "Bloodfang Spaulders", "Shoulder", "Epic", { Agility: "+25", Stamina: "+12" }, 66, source("Raid", { instance: "Molten Core", boss: "Garr", difficulty: "Raid" })),
  chest: item(15090, "Runic Breastplate", "Chest", "Rare", { Strength: "+15", Stamina: "+18" }, 60, source("Dungeon", { instance: "Upper Blackrock Spire", difficulty: "Dungeon" })),
  gloves: item(16826, "Nightslayer Gloves", "Hands", "Epic", { Agility: "+20", Stamina: "+10" }, 66, source("Raid", { instance: "Molten Core", boss: "Garr", difficulty: "Raid" })),
  belt: item(14502, "Frostbite Girdle", "Waist", "Rare", { Strength: "+12", Stamina: "+8" }, 58, source("Dungeon", { instance: "Upper Blackrock Spire", difficulty: "Dungeon" })),
  legs: item(15091, "Runic Legguards", "Legs", "Rare", { Strength: "+18", Stamina: "+16" }, 60),
  boots: item(14549, "Boots of Avoidance", "Feet", "Rare", { Agility: "+14", Stamina: "+10" }, 58, source("Dungeon", { instance: "Upper Blackrock Spire", difficulty: "Dungeon" })),
  blade: item(17075, "Vis'kag the Bloodletter", "Main Hand", "Epic", { "Attack power": "+20", "Critical strike": "+1%" }, 65, source("Raid", { instance: "Blackwing Lair", boss: "Ebonroc", difficulty: "Raid" })),
  offhand: item(18832, "Brutality Blade", "Off Hand / Shield", "Epic", { Agility: "+9", "Critical strike": "+1%" }, 63, source("Raid", { instance: "Molten Core", boss: "Garr", difficulty: "Raid" })),
  ring: item(18821, "Quick Strike Ring", "Finger 1", "Rare", { "Attack power": "+30", "Critical strike": "+1%" }, 63, source("Raid", { instance: "Molten Core", boss: "Garr", difficulty: "Raid" })),
  trinket: item(13965, "Blackhand's Breadth", "Trinket 1", "Rare", { "Critical strike": "+2%" }, 63, source("Quest", { quest: "General Drakkisath's Command", zone: "Burning Steppes", difficulty: "Quest" })),
  cloak: item(13386, "Archivist Cape", "Back", "Uncommon", { Agility: "+7", Stamina: "+6" }, 55, source("Dungeon", { instance: "Stratholme", difficulty: "Dungeon" })),
  necklace: item(17109, "Choker of the Fire Lord", "Neck", "Epic", { "Spell power": "+34", "Critical strike": "+1%" }, 66, source("Raid", { instance: "Molten Core", boss: "Ragnaros", difficulty: "Raid" })),
  wrist: item(16911, "Bloodfang Bracers", "Wrist", "Epic", { Agility: "+15", Stamina: "+9" }, 66, source("Raid", { instance: "Molten Core", boss: "Garr", difficulty: "Raid" })),
  finger2: item(18806, "Core Forged Greaves", "Finger 2", "Uncommon", { Stamina: "+8" }, 60),
  trinket2: item(13965, "Arena Grand Master", "Trinket 2", "Rare", { Stamina: "+12" }, 55, source("Quest", { quest: "Arena Grand Master", zone: "Stranglethorn Vale", difficulty: "Quest" })),
  ranged: item(18713, "Black Bow of the Betrayer", "Ranged / Relic", "Rare", { Agility: "+9" }, 60, source("Dungeon", { instance: "Upper Blackrock Spire", difficulty: "Dungeon" })),
};

export const tbcItems = {
  helm: item(29021, "Warbringer Greathelm", "Head", "Epic", { Strength: "+36", Stamina: "+48" }, 120, source("Raid", { instance: "Karazhan", boss: "Prince Malchezaar", difficulty: "Raid" })),
  shoulders: item(29023, "Warbringer Shoulderplates", "Shoulder", "Epic", { Strength: "+24", Stamina: "+35" }, 120, source("Raid", { instance: "Gruul's Lair", boss: "Gruul", difficulty: "Raid" })),
  chest: item(28602, "Robe of Oblivion", "Chest", "Rare", { "Spell power": "+38", Stamina: "+22" }, 115, source("Dungeon", { instance: "The Mechanar", difficulty: "Heroic" })),
  gloves: item(29020, "Warbringer Handguards", "Hands", "Epic", { Strength: "+27", Stamina: "+31" }, 120, source("Raid", { instance: "Karazhan", boss: "The Curator", difficulty: "Raid" })),
  belt: item(29238, "Lion's Heart Girdle", "Waist", "Rare", { Strength: "+20", Stamina: "+24" }, 115, source("Dungeon", { instance: "The Mechanar", difficulty: "Heroic" })),
  legs: item(28988, "Marshal's Plate Legguards", "Legs", "Rare", { Strength: "+30", Stamina: "+39" }, 115),
  boots: item(28747, "Battle-Mage's Slippers", "Feet", "Rare", { "Spell power": "+31", Stamina: "+20" }, 115, source("Dungeon", { instance: "Karazhan", boss: "The Curator", difficulty: "Dungeon" })),
  blade: item(28767, "The Decapitator", "Main Hand", "Epic", { Strength: "+35", "Hit rating": "+20" }, 115, source("Raid", { instance: "Karazhan", boss: "Prince Malchezaar", difficulty: "Raid" })),
  offhand: item(28749, "King's Defender", "Off Hand / Shield", "Epic", { Block: "+24", Stamina: "+30" }, 115, source("Raid", { instance: "Karazhan", boss: "Prince Malchezaar", difficulty: "Raid" })),
  ring: item(28757, "Ring of Recurrence", "Finger 1", "Epic", { "Spell power": "+24", "Critical strike": "+1%" }, 115, source("Raid", { instance: "Karazhan", boss: "The Curator", difficulty: "Raid" })),
  trinket: item(28785, "Studious Wrap", "Trinket 1", "Epic", { "Spell power proc": "+160" }, 115, source("Raid", { instance: "Karazhan", boss: "Moroes", difficulty: "Raid" })),
  cloak: item(28672, "Drape of the Dark Reavers", "Back", "Rare", { "Spell power": "+22", Stamina: "+15" }, 115, source("Dungeon", { instance: "The Mechanar", difficulty: "Heroic" })),
  necklace: item(28609, "Embersilk Coronet", "Neck", "Rare", { "Spell power": "+18", Stamina: "+12" }, 115, source("Dungeon", { instance: "The Botanica", difficulty: "Heroic" })),
  wrist: item(28515, "Bands of Nefarious Deeds", "Wrist", "Rare", { "Spell power": "+15", Stamina: "+10" }, 115, source("Dungeon", { instance: "The Mechanar", difficulty: "Heroic" })),
  finger2: item(28753, "Ring of Recurrence", "Finger 2", "Rare", { "Spell power": "+14", Stamina: "+12" }, 110),
  trinket2: item(27683, "Quagmirran's Eye", "Trinket 2", "Rare", { "Spell power proc": "+120" }, 115, source("Dungeon", { instance: "The Slave Pens", boss: "Quagmirran", difficulty: "Heroic" })),
  ranged: item(28673, "Tirisfal Wand of Ascendancy", "Ranged / Relic", "Rare", { "Spell power": "+19" }, 115, source("Dungeon", { instance: "The Mechanar", difficulty: "Heroic" })),
};

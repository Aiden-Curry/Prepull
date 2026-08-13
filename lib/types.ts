export type ContentVersion = "era" | "tbc";
export type CharacterRealmType = "era" | "anniversary";
/** @deprecated Use ContentVersion for site content routing. */
export type GameVersion = ContentVersion;
export type IconTone = "gold" | "green" | "purple" | "red" | "blue";
export type Raid = { name: string; location: string; level: string; bosses: number; accent: IconTone };
export type ClassInfo = { name: string; role: string; initials: string; tone: IconTone };
export type Tool = { name: string; description: string; icon: string; featured?: boolean };
export type GameConfig = { name: string; shortName: string; tagline: string; raids: Raid[]; classes: ClassInfo[]; tools: Tool[] };

export type Region = "eu" | "us";
export type Faction = "Alliance" | "Horde";
export type ItemQuality = "Poor" | "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type EquipmentSlot = "Head" | "Neck" | "Shoulder" | "Back" | "Chest" | "Wrist" | "Hands" | "Waist" | "Legs" | "Feet" | "Finger 1" | "Finger 2" | "Trinket 1" | "Trinket 2" | "Main Hand" | "Off Hand / Shield" | "Ranged / Relic";
export type SourceType = "Dungeon" | "Raid" | "Quest" | "Vendor" | "Reputation" | "Profession" | "PvP" | "World Drop" | "Badge Vendor";
export type UpgradeTier = "Sidegrade" | "Minor" | "Meaningful" | "Major" | "BestInSlot";
export type GearStats = Record<string, string>;
export type CharacterSource = { type: SourceType; zone?: string; instance?: string; boss?: string; npc?: string; quest?: string; reputation?: string; profession?: string; requiredLevel?: number; phase?: string; difficulty?: string; category?: "Pre-raid" | "Raid" | "Quest" | "Crafted" | "World drop"; raidSize?: 20 | 40; verification?: "verified" | "curated" | "unverified" };
export type WeaponProperties = { damageMin: number; damageMax: number; speed: number; dps: number; hand: "one-hand" | "two-hand"; weaponType?: string; weaponSkillBonus?: number };
export type WeaponSkillContext = { skills: Record<string, number>; racialBonuses?: Record<string, number>; source: "provider" | "profile" | "unknown" };
export type EquippedItem = { itemId: number; name: string; slot: EquipmentSlot; quality: ItemQuality; itemLevel?: number; icon: string; stats: GearStats; enchantments?: string[]; weapon?: WeaponProperties; setId?: string; specialEffectId?: string; uniqueGroup?: string; source?: CharacterSource; missing?: boolean };
export type CharacterTalent = { name: string; rank: number };
export type ProviderName = "mock" | "blizzard";
export type CharacterDataMeta = { provider: ProviderName; lastUpdated?: string; isLive: boolean };
export type NormalizedCharacter = { id: string; name: string; region: Region; realm: string; contentVersion: ContentVersion; realmType: CharacterRealmType; level: number; race: string; class: string; spec: string; faction: Faction; professions: string[]; talents?: CharacterTalent[]; weaponSkillContext?: WeaponSkillContext; equipment: EquippedItem[]; dataMeta?: CharacterDataMeta };
export type UpgradeRecommendation = { slot: EquipmentSlot; currentItem?: EquippedItem; candidateItem: EquippedItem; upgradeTier: UpgradeTier; reason: string; source: CharacterSource; difficulty: string; availability: string; confidence?: "High" | "Medium" | "Limited"; explanation?: { statDeltas: Record<string, number>; breakpointChanges: string[]; setChanges: string[]; assumptions: string[] }; profileVersion?: string; bestRealistic?: boolean; bestInSlot?: boolean; realisticReason?: string };
export type UpgradeSummary = { total: number; meaningful: number; easy: number; dungeon: number; raid: number };

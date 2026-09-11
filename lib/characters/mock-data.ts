import { EquippedItem, NormalizedCharacter, CharacterRealmType, ContentVersion } from "../types";
import { tbcItems } from "./items";
import { normalizeLookup } from "./normalization";
import { eraFuryFixtures } from "../gear-analysis/fixtures";
import { eraFrostMageFixtures } from "../gear-analysis/mage-fixtures";
import { eraCombatRogueFixtures, eraHolyPriestFixtures, eraMarksmanshipHunterFixtures } from "../gear-analysis/additional-spec-fixtures";
const gear = (items: Record<string, EquippedItem>) => Object.values(items);
export const mockCharacters: NormalizedCharacter[] = [
  { ...eraFuryFixtures.fresh60, id: "era-eu-firemaw-aidy", name: "Aidy", dataMeta: { provider: "mock", isLive: false } },
  { ...eraFuryFixtures.fresh60, id: "era-eu-firemaw-freshfury", name: "Freshfury", dataMeta: { provider: "mock", isLive: false } },
  { ...eraFrostMageFixtures.browserBaseline, id: "era-us-whitemane-lyria", name: "Lyria", dataMeta: { provider: "mock", isLive: false } },
  { ...eraFrostMageFixtures.browserProgressed, id: "era-us-whitemane-lyriaprogress", name: "Lyriaprogress", dataMeta: { provider: "mock", isLive: false } },
  { ...eraFrostMageFixtures.fresh60, id: "era-us-whitemane-pyra", name: "Pyra", spec: "Fire", dataMeta: { provider: "mock", isLive: false } },
  { ...eraCombatRogueFixtures.fresh60, id: "era-eu-firemaw-rivyn", name: "Rivyn", dataMeta: { provider: "mock", isLive: false } },
  { ...eraMarksmanshipHunterFixtures.fresh60, id: "era-us-whitemane-talan", name: "Talan", dataMeta: { provider: "mock", isLive: false } },
  { ...eraHolyPriestFixtures.fresh60, id: "era-eu-firemaw-elowen", name: "Elowen", dataMeta: { provider: "mock", isLive: false } },
  { id: "tbc-anniversary-spineshatter-aidy", name: "Aidy", region: "eu", realm: "Spineshatter", contentVersion: "tbc", realmType: "anniversary", level: 70, race: "Orc", class: "Warrior", spec: "Protection", faction: "Horde", professions: ["Jewelcrafting", "Mining"], equipment: gear(tbcItems) },
  { id: "tbc-anniversary-us-benediction-selene", name: "Selene", region: "us", realm: "Benediction", contentVersion: "tbc", realmType: "anniversary", level: 70, race: "Draenei", class: "Priest", spec: "Holy", faction: "Alliance", professions: ["Tailoring", "Enchanting"], equipment: gear(tbcItems).map((item) => ({ ...item, name: item.slot === "Main Hand" ? "Light's Justice" : item.name, stats: item.slot === "Main Hand" ? { "Healing power": "+550", "Mana per 5": "+8" } : item.stats })) },
];
export const findMockCharacter = (contentVersion: ContentVersion, realmType: CharacterRealmType, region: string, realm: string, name: string) => mockCharacters.find((character) => character.contentVersion === contentVersion && character.realmType === realmType && character.region === region && normalizeLookup(character.realm) === normalizeLookup(realm) && normalizeLookup(character.name) === normalizeLookup(name));

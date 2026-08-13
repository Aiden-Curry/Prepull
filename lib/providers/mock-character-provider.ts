import { findMockCharacter, mockCharacters } from "../characters/mock-data";
import { CharacterLookup, CharacterProvider } from "./character-provider";
export class MockCharacterProvider implements CharacterProvider { async findCharacter(lookup: CharacterLookup) { const character = findMockCharacter(lookup.contentVersion, lookup.realmType, lookup.region, lookup.realm, lookup.characterName); return character ? { ...character, dataMeta: { provider: "mock" as const, isLive: false } } : null; } async getCharacter(id: string) { const character = mockCharacters.find((item) => item.id === id); return character ? { ...character, dataMeta: { provider: "mock" as const, isLive: false } } : null; } }
export const mockCharacterProvider = new MockCharacterProvider();

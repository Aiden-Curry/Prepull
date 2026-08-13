import { BattleNetCharacterProvider } from "../blizzard/character-provider";
import { CharacterProvider } from "./character-provider";
import { mockCharacterProvider } from "./mock-character-provider";

export function getCharacterProvider(): CharacterProvider {
  if (process.env.PREPULL_CHARACTER_PROVIDER === "mock") return mockCharacterProvider;
  if (process.env.PREPULL_CHARACTER_PROVIDER === "blizzard" || process.env.PREPULL_CHARACTER_PROVIDER === "battlenet" || (process.env.BATTLENET_CLIENT_ID && process.env.BATTLENET_CLIENT_SECRET)) return new BattleNetCharacterProvider();
  return mockCharacterProvider;
}

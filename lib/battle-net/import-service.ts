import { getCharacterProvider } from "../providers/factory.ts";
import { CharacterProviderError } from "../providers/character-provider.ts";
import { normalizeLookup } from "../characters/normalization.ts";
import { normalizeSavedCharacterInput, savedCharacterRepository } from "../characters/saved-repository.ts";
import { characterSyncRepository } from "../characters/sync-repository.ts";
import { battleNetRepository } from "./repository.ts";

export async function importBattleNetCharacter(input: { userId: string; sessionId: string; characterId: string }) {
  const session = await battleNetRepository.getImportSession(input.userId, input.sessionId);
  const discovered = await battleNetRepository.claimImportCharacter(input.userId, session.id, input.characterId);
  if (discovered.contentSupport !== "supported" || discovered.importStatus === "unsupported") return discovered;
  if (["imported", "already_added"].includes(discovered.importStatus)) return discovered;
  try {
    const character = await getCharacterProvider().findCharacter({ contentVersion: session.contentVersion, realmType: "era", region: discovered.region, realm: discovered.realmSlug, characterName: discovered.name });
    if (!character) return battleNetRepository.completeImportCharacter(discovered.id, "failed", undefined, "CharacterNotFound");
    const existing = await savedCharacterRepository.findSavedCharacterByIdentity(input.userId, { region: character.region, realmSlug: character.realm, normalizedCharacterName: character.name, characterRealmType: character.realmType });
    if (existing && await characterSyncRepository.getLatestSuccessful(existing.id)) { console.info("[battle-net-import] character complete", { event: "battle_net.character_imported", outcome: "already_added" }); return battleNetRepository.completeImportCharacter(discovered.id, "already_added", existing.id); }
    const saved = existing ?? await savedCharacterRepository.saveCharacter(input.userId, normalizeSavedCharacterInput({ region: character.region, realmSlug: normalizeLookup(character.realm), realmName: character.realm, characterName: character.name, normalizedCharacterName: normalizeLookup(character.name), characterRealmType: character.realmType, contentVersion: character.contentVersion, className: character.class, level: character.level, race: character.race, faction: character.faction, lastSyncedAt: character.dataMeta?.lastUpdated }));
    await characterSyncRepository.recordSuccess(saved.id, character);
    console.info("[battle-net-import] character complete", { event: "battle_net.character_imported", outcome: "imported" });
    return battleNetRepository.completeImportCharacter(discovered.id, "imported", saved.id);
  } catch (error) {
    const failure = error instanceof CharacterProviderError ? error.code : "ImportFailed";
    console.warn("[battle-net-import] character failed", { event: "battle_net.character_import_failed", failure });
    return battleNetRepository.completeImportCharacter(discovered.id, "failed", undefined, failure);
  }
}

import { requireAuthenticatedUser } from "../auth.ts";
import { getCharacterProvider } from "../providers/factory.ts";
import { savedCharacterRepository } from "../characters/saved-repository.ts";
import type { NormalizedCharacter } from "../types.ts";
import { buildPlayerAdvice } from "./service.ts";
import type { PlayerAdvice } from "./types.ts";
import { characterFromSync, characterSyncRepository } from "../characters/sync-repository.ts";
import { completedTargetNames, diffEquipment } from "../characters/sync-service.ts";

export async function loadPrimaryAdvice() {
  const user = await requireAuthenticatedUser();
  const characters = await savedCharacterRepository.listSavedCharacters(user.id);
  const primary = characters.find((character) => character.isPrimary);
  if (!primary) return { user, characters, primary, character: undefined, advice: undefined as PlayerAdvice | undefined, latestSync: undefined, previousSync: undefined, latestAttempt: undefined, progress: undefined };
  const latestSync = await characterSyncRepository.getLatestSuccessful(primary.id);
  const previousSync = await characterSyncRepository.getPreviousSuccessful(primary.id);
  const latestAttempt = await characterSyncRepository.getLatestAttempt(primary.id);
  if (latestSync) {
    const character = characterFromSync({ id: primary.id, name: primary.characterName, region: primary.region, realmName: primary.realmName, contentVersion: primary.contentVersion, characterRealmType: primary.characterRealmType }, latestSync);
    const advice = buildPlayerAdvice(character).advice; const targetIds = new Set([...advice.topActions, ...advice.secondaryActions].flatMap((action) => action.targets.map((target) => target.itemId))); const previousCharacter = previousSync ? characterFromSync({ id: primary.id, name: primary.characterName, region: primary.region, realmName: primary.realmName, contentVersion: primary.contentVersion, characterRealmType: primary.characterRealmType }, previousSync) : undefined; const progress = diffEquipment(previousSync, latestSync); progress.completedTargets = completedTargetNames(previousCharacter, character, targetIds);
    return { user, characters, primary, character, advice, latestSync, previousSync, latestAttempt, progress };
  }
  try {
    const character = await getCharacterProvider().findCharacter({ contentVersion: primary.contentVersion, realmType: primary.characterRealmType, region: primary.region, realm: primary.realmSlug, characterName: primary.characterName });
    if (character) return { user, characters, primary, character, advice: buildPlayerAdvice(character).advice, latestSync, previousSync, latestAttempt, progress: undefined };
  } catch { /* retain the saved identity and show a safe unavailable state */ }
  const fallback: PlayerAdvice = { supported: false, characterId: primary.id, contentVersion: primary.contentVersion, phase: null, summary: { evaluatedSlots: 0, actionableUpgradeCount: 0, highPriorityCount: 0 }, topActions: [], secondaryActions: [], secondaryTargets: [], limitations: ["Live character data is temporarily unavailable. Refresh when the provider is available to calculate personal advice."] };
  return { user, characters, primary, character: undefined as NormalizedCharacter | undefined, advice: fallback, latestSync, previousSync, latestAttempt, progress: undefined };
}

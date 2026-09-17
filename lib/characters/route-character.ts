import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { getCharacterProvider } from "../providers/factory";
import type { CharacterLookup } from "../providers/character-provider";
import { savedCharacterRepository } from "./saved-repository";
import { characterFromSync, characterSyncRepository } from "./sync-repository";

// Existing deep links must not bypass persisted state for an owned saved character.
export async function loadRouteCharacter(lookup: CharacterLookup) {
  const session = await getServerSession(authOptions);
  const saved = session?.user?.id ? await savedCharacterRepository.findSavedCharacterByIdentity(session.user.id, {
    region: lookup.region, realmSlug: lookup.realm, normalizedCharacterName: lookup.characterName, characterRealmType: lookup.realmType,
  }) : undefined;
  if (saved) {
    const sync = await characterSyncRepository.getLatestSuccessful(saved.id);
    return { saved: true, character: sync ? characterFromSync({ id: saved.id, name: saved.characterName, region: saved.region, realmName: saved.realmName, contentVersion: lookup.contentVersion, characterRealmType: saved.characterRealmType }, sync) : undefined };
  }
  return { saved: false, character: await getCharacterProvider().findCharacter(lookup) };
}

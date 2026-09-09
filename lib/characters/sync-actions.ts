"use server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "../auth.ts";
import { getCharacterProvider } from "../providers/factory.ts";
import { CharacterProviderError } from "../providers/character-provider.ts";
import { savedCharacterRepository } from "./saved-repository.ts";
import { characterSyncRepository } from "./sync-repository.ts";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const safeMessage = (error: unknown) => error instanceof CharacterProviderError ? error.message : "We couldn’t refresh this character right now. Your previous gear data is still being used.";
export async function refreshCharacterAction(form: FormData) {
  const user = await requireAuthenticatedUser(); const id = text(form, "characterId");
  const saved = await savedCharacterRepository.getSavedCharacter(user.id, id); if (!saved) throw new Error("Saved character not found.");
  const latest = await characterSyncRepository.getLatestAttempt(saved.id); if (latest && Date.now() - new Date(latest.syncedAt).getTime() < 30_000) { revalidatePath(`/${saved.contentVersion}/dashboard`); return; }
  if (saved.characterRealmType === "anniversary") { await characterSyncRepository.recordFailure(saved.id, { provider: "unsupported", contentVersion: saved.contentVersion, characterRealmType: saved.characterRealmType, code: "UnsupportedRealmType", message: "Live Anniversary character profiles aren't available yet." }); revalidatePath(`/${saved.contentVersion}/dashboard`); return; }
  try { const character = await getCharacterProvider().findCharacter({ contentVersion: saved.contentVersion, realmType: saved.characterRealmType, region: saved.region, realm: saved.realmName, characterName: saved.characterName }); if (!character) throw new CharacterProviderError("CharacterNotFound", "Character not found."); await characterSyncRepository.recordSuccess(saved.id, character); }
  catch (error) { await characterSyncRepository.recordFailure(saved.id, { provider: "character-provider", contentVersion: saved.contentVersion, characterRealmType: saved.characterRealmType, code: error instanceof CharacterProviderError ? error.code : "RefreshFailed", message: safeMessage(error) }); }
  revalidatePath(`/${saved.contentVersion}/dashboard`); revalidatePath(`/${saved.contentVersion}/profile`); revalidatePath(`/${saved.contentVersion}/onboarding`);
}

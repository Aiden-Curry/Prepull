"use server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "../auth.ts";
import { getCharacterProvider } from "../providers/factory.ts";
import { CharacterProviderError } from "../providers/character-provider.ts";
import { normalizeLookup } from "./normalization.ts";
import { normalizeSavedCharacterInput, savedCharacterRepository } from "./saved-repository.ts";
import type { CharacterRealmType, ContentVersion, Region } from "../types.ts";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const inputFromForm = (form: FormData) => ({ contentVersion: text(form, "contentVersion") as ContentVersion, realmType: text(form, "realmType") as CharacterRealmType, region: text(form, "region") as Region, realm: text(form, "realm"), characterName: text(form, "characterName") });
export async function saveCharacterAction(form: FormData) {
  const user = await requireAuthenticatedUser();
  const lookup = inputFromForm(form);
  if (!["era", "tbc"].includes(lookup.contentVersion) || !["era", "anniversary"].includes(lookup.realmType) || !["eu", "us"].includes(lookup.region) || !lookup.realm || !lookup.characterName) throw new Error("Enter a valid character lookup.");
  const character = await getCharacterProvider().findCharacter(lookup);
  if (!character) throw new Error("Character not found. Search again.");
  await savedCharacterRepository.saveCharacter(user.id, normalizeSavedCharacterInput({ region: character.region, realmSlug: normalizeLookup(character.realm), realmName: character.realm, characterName: character.name, normalizedCharacterName: normalizeLookup(character.name), characterRealmType: character.realmType, contentVersion: character.contentVersion, className: character.class, level: character.level, race: character.race, faction: character.faction, lastSyncedAt: character.dataMeta?.lastUpdated }));
  revalidatePath(`/${lookup.contentVersion}/onboarding`); revalidatePath(`/${lookup.contentVersion}/dashboard`); revalidatePath(`/${lookup.contentVersion}/characters/connect`);
}
export async function setPrimaryCharacterAction(form: FormData) { const user = await requireAuthenticatedUser(); const id = text(form, "characterId"); if (!id) throw new Error("Saved character not found."); await savedCharacterRepository.setPrimaryCharacter(user.id, id); revalidatePath("/era/dashboard"); revalidatePath("/tbc/dashboard"); revalidatePath("/era/onboarding"); revalidatePath("/tbc/onboarding"); }
export async function removeCharacterAction(form: FormData) { const user = await requireAuthenticatedUser(); const id = text(form, "characterId"); if (!id) throw new Error("Saved character not found."); await savedCharacterRepository.removeSavedCharacter(user.id, id); revalidatePath("/era/dashboard"); revalidatePath("/tbc/dashboard"); revalidatePath("/era/onboarding"); revalidatePath("/tbc/onboarding"); }

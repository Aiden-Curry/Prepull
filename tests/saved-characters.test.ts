import assert from "node:assert/strict";
import test from "node:test";
import { normalizeLookup } from "../lib/characters/normalization.ts";
import { normalizeSavedCharacterInput } from "../lib/characters/saved-repository.ts";

test("saved character identity normalizes realm and character names", () => {
  const input = normalizeSavedCharacterInput({ region: "eu", realmSlug: " Firemaw ", realmName: "Firemaw", characterName: "Aidy's Alt", normalizedCharacterName: "ignored", characterRealmType: "era", contentVersion: "tbc", className: "Warrior", level: 70, race: "Orc", faction: "Horde" });
  assert.equal(input.realmSlug, "firemaw");
  assert.equal(input.normalizedCharacterName, "aidys-alt");
});

test("content version is independent from character realm type", () => {
  const input = normalizeSavedCharacterInput({ region: "us", realmSlug: "spineshatter", realmName: "Spineshatter", characterName: "Selene", normalizedCharacterName: normalizeLookup("Selene"), characterRealmType: "anniversary", contentVersion: "tbc", className: "Priest", level: 70, race: "Draenei", faction: "Alliance" });
  assert.equal(input.characterRealmType, "anniversary");
  assert.equal(input.contentVersion, "tbc");
});

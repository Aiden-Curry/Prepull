import assert from "node:assert/strict";
import test from "node:test";
import { validateFinderQuery, safeFinderError } from "../lib/characters/finder.ts";
import { CharacterProviderError } from "../lib/providers/character-provider.ts";

test("finder validates and normalizes an exact lookup without coupling version to realm type", () => {
  const result = validateFinderQuery("tbc", { region: "eu", realmType: "era", realm: " Firemaw ", name: " Aidy " });
  assert.equal(result.ok, true); if (result.ok) assert.deepEqual(result.lookup, { contentVersion: "tbc", region: "eu", realmType: "era", realm: "firemaw", characterName: "aidy" });
  assert.equal(validateFinderQuery("era", { region: "apac", realmType: "era", realm: "Firemaw", name: "Aidy" }).ok, false);
  assert.equal(validateFinderQuery("era", { region: "eu", realmType: "era", realm: "", name: "Aidy" }).ok, false);
});

test("finder projects provider failures without reflecting internal messages", () => {
  assert.match(safeFinderError(new CharacterProviderError("CharacterNotFound", "internal provider detail")), /couldn't find/i);
  assert.match(safeFinderError(new CharacterProviderError("UnsupportedRealmType", "internal provider detail")), /Anniversary/i);
  assert.doesNotMatch(safeFinderError(new CharacterProviderError("AuthenticationFailure", "secret provider detail")), /secret provider detail/);
});

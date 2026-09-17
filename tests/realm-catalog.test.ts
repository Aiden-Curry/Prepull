import assert from "node:assert/strict";
import test from "node:test";
import { REALM_CATALOG, searchRealms, selectedRealm, type RealmEntry } from "../lib/realms/catalog.ts";
test("realm catalog filters EU, US and Era/Anniversary independently", () => {
  assert.ok(searchRealms(REALM_CATALOG, "eu", "era", "Fire").some((realm) => realm.slug === "firemaw"));
  assert.ok(searchRealms(REALM_CATALOG, "us", "era", "White").some((realm) => realm.slug === "whitemane"));
  assert.ok(searchRealms(REALM_CATALOG, "eu", "anniversary").some((realm) => realm.slug === "spineshatter"));
  assert.ok(searchRealms(REALM_CATALOG, "us", "anniversary").every((realm) => realm.region === "us" && realm.realmType === "anniversary" && realm.id === undefined));
  assert.equal(selectedRealm(REALM_CATALOG, "us", "era", "Firemaw"), undefined);
  assert.equal(selectedRealm(REALM_CATALOG, "eu", "era", "Spineshatter"), undefined);
});
test("matching normalizes case and spacing, ranks prefix before substring and resolves stable identity", () => {
  const entries: RealmEntry[] = ["Old Fire", "Fire Tree", "Firemaw"].map((name, index) => ({ id: index, name, slug: name.toLowerCase().replaceAll(" ", "-"), region: "eu", realmType: "era" }));
  assert.deepEqual(searchRealms(entries, "eu", "era", " FIRE ").map((realm) => realm.name), ["Fire Tree", "Firemaw", "Old Fire"]);
  assert.equal(searchRealms(entries, "eu", "era", "fire-tree")[0].slug, "fire-tree");
  assert.deepEqual(searchRealms(entries, "eu", "era"), searchRealms([...entries].reverse(), "eu", "era"));
  assert.equal(selectedRealm(entries, "eu", "era", "not-real"), undefined);
  assert.equal(selectedRealm(entries, "eu", "era", "Fire Tree")?.slug, "fire-tree");
  const duplicates = [...entries, { ...entries[0], region: "us" as const }]; assert.equal(searchRealms(duplicates, "us", "era").length, 1);
});

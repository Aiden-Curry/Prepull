import type { ContentVersion } from "../types.ts";
import { recommendationRegistry } from "./registry.ts";

const eraSpecializations: Readonly<Record<string, readonly string[]>> = {
  Warrior: ["Arms", "Fury", "Protection"], Paladin: ["Holy", "Protection", "Retribution"], Hunter: ["Beast Mastery", "Marksmanship", "Survival"],
  Rogue: ["Assassination", "Combat", "Subtlety"], Priest: ["Discipline", "Holy", "Shadow"], Shaman: ["Elemental", "Enhancement", "Restoration"],
  Mage: ["Arcane", "Fire", "Frost"], Warlock: ["Affliction", "Demonology", "Destruction"], Druid: ["Balance", "Feral", "Restoration"],
};

export function getSupportMatrix(contentVersion: ContentVersion) {
  const catalog = contentVersion === "era" ? eraSpecializations : eraSpecializations;
  return Object.entries(catalog).map(([className, specs]) => ({ className, specs: specs.map((specName) => {
    const registration = recommendationRegistry.find((entry) => entry.contentVersion === contentVersion && entry.className === className && entry.specName === specName);
    return registration ? { specName, status: "supported" as const, specKey: registration.key, phases: registration.manifest.phases.map((phase) => phase.label) } : { specName, status: "coming-later" as const, phases: [] as string[] };
  }) }));
}

export function generatedSupportMarkdown(contentVersion: ContentVersion) {
  const lines = [`# ${contentVersion === "era" ? "Classic Era" : "The Burning Crusade"} recommendation support`, "", "Generated from the recommendation registry. Do not edit by hand.", ""];
  for (const entry of getSupportMatrix(contentVersion)) {
    lines.push(`## ${entry.className}`, "");
    for (const spec of entry.specs) lines.push(`- ${spec.specName}: ${spec.status === "supported" ? `Supported (${spec.phases.join(" + ")})` : "Coming later"}`);
    lines.push("");
  }
  return `${lines.join("\n").trim()}\n`;
}

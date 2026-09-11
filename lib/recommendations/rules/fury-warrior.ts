import type { SpecRuleModule } from "../manifest.ts";

const blackDragonMailIds = new Set([16984, 15050, 15051, 15052]);
const daggerIds = new Set([18805, 18816]);

export const furyWarriorRules: SpecRuleModule = {
  id: "fury-weapon-race-and-set-context-v1",
  validate: () => [],
  compareOptions({ character, slot, left, right }) {
    if (slot !== "Hands" || !character.equipment.some((item) => daggerIds.has(item.itemId) || item.weapon?.weaponType === "Dagger")) return 0;
    return Number(right.itemId === 18823) - Number(left.itemId === 18823);
  },
  conditionalNotes({ character, item, options }) {
    const notes: string[] = [];
    if (item.weapon?.weaponType === "Axe" && character.race === "Orc") notes.push("Orc racial axe expertise is relevant; no numerical performance delta is claimed.");
    if (["Sword", "Mace"].includes(item.weapon?.weaponType ?? "") && character.race === "Human") notes.push("Human racial weapon expertise is relevant; no numerical performance delta is claimed.");
    if (blackDragonMailIds.has(item.itemId)) {
      const equippedPieces = character.equipment.filter((equipped) => blackDragonMailIds.has(equipped.itemId)).length;
      const resultingPieces = equippedPieces + (character.equipment.some((equipped) => equipped.itemId === item.itemId) ? 0 : 1);
      notes.push(`Black Dragon Mail context: ${equippedPieces} piece(s) equipped; this option results in ${resultingPieces} piece(s).`);
      if (resultingPieces >= 3) notes.push("Active 3-piece bonus: +2% critical strike.");
      else if (resultingPieces >= 2) notes.push("Active 2-piece bonus: +1% hit.");
    }
    if ([20130, 21180].includes(item.itemId)) notes.push("On-use trinket; evaluate cooldown alignment and paired-trinket conflicts contextually.");
    if (character.race === "Orc" && options.some((option) => option.weapon?.weaponType === "Axe" || [811, 871, 13015].includes(option.itemId))) notes.push("Axe alternatives are Orc-favored through racial axe expertise; ordering remains contextual and no numerical performance delta is claimed.");
    if (character.race === "Human" && options.some((option) => ["Sword", "Mace"].includes(option.weapon?.weaponType ?? ""))) notes.push("Sword/mace alternatives are Human-favored through racial weapon expertise; ordering remains contextual and no numerical performance delta is claimed.");
    return notes;
  },
};

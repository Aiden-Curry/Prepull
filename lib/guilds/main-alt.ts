export type Relationship = { mainMemberId: string; altMemberId: string };
export type MainAltConflictKind = "self-main" | "referenced-main-not-found" | "duplicate-imported-character" | "multiple-proposed-mains" | "existing-main-differs" | "imported-rows-disagree" | "relationship-cycle" | "cross-guild-reference" | "inactive-main" | "inactive-alt" | "linked-user-conflict" | "approved-claim-conflict" | "normalized-name-ambiguity" | "unresolved-main-name";
export type MainAltDecision = "preserve-existing" | "apply-imported" | "leave-unassigned" | "map-to-existing-character";
export type MainAltConflict = { id: string; kind: MainAltConflictKind; rows: number[]; characterId?: string; characterName: string; existingMainId?: string; proposedMainName?: string; proposedMainId?: string; explanation: string; allowedDecisions: MainAltDecision[]; blocking: boolean };
export type RelationshipPlan = { decisions: Array<{ altMemberId: string; mainMemberId?: string; decision: MainAltDecision; conflictId?: string }>; conflicts: MainAltConflict[] };

export function normalizedName(name: string) { return name.trim().toLocaleLowerCase(); }
export function validateRelationshipGraph(relationships: Relationship[], memberIds: Set<string>, guildId?: string) {
  const mains = new Map<string, string>();
  for (const relation of relationships) {
    if (!memberIds.has(relation.mainMemberId) || !memberIds.has(relation.altMemberId)) throw new Error("cross-guild-main");
    if (relation.mainMemberId === relation.altMemberId) throw new Error("self-main");
    if (mains.has(relation.altMemberId)) throw new Error("multiple-mains");
    mains.set(relation.altMemberId, relation.mainMemberId);
  }
  for (const start of mains.keys()) {
    const seen = new Set<string>(); let current: string | undefined = start;
    while (current && mains.has(current)) { if (seen.has(current)) throw new Error("main-alt-cycle"); seen.add(current); current = mains.get(current); }
  }
  return { guildId, relationshipCount: relationships.length };
}

export function classifyMainAltRows(rows: Array<{ row: number; name: string; mainName: string }>, existing: Array<{ id: string; characterName: string; active?: boolean; mainMemberId?: string }>): MainAltConflict[] {
  const byName = new Map<string, typeof existing>(); for (const member of existing) { const key = normalizedName(member.characterName); byName.set(key, [...(byName.get(key) ?? []), member]); }
  const conflicts: MainAltConflict[] = []; const importedNames = new Map<string, number[]>();
  rows.forEach((row) => { importedNames.set(normalizedName(row.name), [...(importedNames.get(normalizedName(row.name)) ?? []), row.row]); });
  for (const [name, rowNumbers] of importedNames) if (rowNumbers.length > 1) conflicts.push({ id:`duplicate-imported-character:${name}`,kind:"duplicate-imported-character",rows:rowNumbers,characterName:name,explanation:"The same character appears more than once in this import.",allowedDecisions:[],blocking:true });
  for (const row of rows) {
    if (!row.mainName) continue;
    const character = byName.get(normalizedName(row.name))?.[0]; const target = byName.get(normalizedName(row.mainName)) ?? [];
    if (normalizedName(row.name) === normalizedName(row.mainName)) { conflicts.push({id:`self-main:${row.row}`,kind:"self-main",rows:[row.row],characterId:character?.id,characterName:row.name,proposedMainName:row.mainName,explanation:"A character cannot be its own main.",allowedDecisions:[],blocking:true}); continue; }
    if (target.length === 0) conflicts.push({id:`unresolved-main-name:${row.row}`,kind:"unresolved-main-name",rows:[row.row],characterId:character?.id,characterName:row.name,proposedMainName:row.mainName,explanation:"The imported main is not an existing unambiguous guild character.",allowedDecisions:["preserve-existing","leave-unassigned","map-to-existing-character"],blocking:true});
    else if (target.length > 1) conflicts.push({id:`normalized-name-ambiguity:${row.row}`,kind:"normalized-name-ambiguity",rows:[row.row],characterId:character?.id,characterName:row.name,proposedMainName:row.mainName,explanation:"The main name matches more than one guild character.",allowedDecisions:["preserve-existing","leave-unassigned","map-to-existing-character"],blocking:true});
    else {
      const main = target[0];
      if (main.active === false) conflicts.push({id:`inactive-main:${row.row}`,kind:"inactive-main",rows:[row.row],characterId:character?.id,characterName:row.name,proposedMainName:main.characterName,proposedMainId:main.id,explanation:"The proposed main is inactive and requires explicit review.",allowedDecisions:["preserve-existing","apply-imported","leave-unassigned"],blocking:true});
      if (character?.mainMemberId && character.mainMemberId !== main.id) conflicts.push({id:`existing-main-differs:${row.row}`,kind:"existing-main-differs",rows:[row.row],characterId:character.id,characterName:row.name,existingMainId:character.mainMemberId,proposedMainId:main.id,proposedMainName:main.characterName,explanation:"The imported main differs from the current relationship.",allowedDecisions:["preserve-existing","apply-imported","leave-unassigned"],blocking:false});
    }
  }
  return conflicts;
}

export function safeConflictSummary(conflict: MainAltConflict) { return { id: conflict.id, kind: conflict.kind, rows: conflict.rows, characterId: conflict.characterId, characterName: conflict.characterName, existingMainId: conflict.existingMainId, proposedMainId: conflict.proposedMainId, proposedMainName: conflict.proposedMainName, explanation: conflict.explanation, allowedDecisions: conflict.allowedDecisions, blocking: conflict.blocking }; }

import type { NormalizedCharacter } from "../../types.ts";
import type { GearAnalysisResult } from "../types.ts";

export type AnalysisSnapshot = { generatedAt: string; character: Pick<NormalizedCharacter, "name" | "realm" | "region" | "contentVersion" | "realmType" | "level" | "race" | "class" | "spec" | "equipment">; assumptions?: GearAnalysisResult["assumptions"]; recommendations: GearAnalysisResult["recommendations"]; activities: GearAnalysisResult["activities"] };

export function createAnalysisSnapshot(character: NormalizedCharacter, analysis: GearAnalysisResult): AnalysisSnapshot {
  return { generatedAt: new Date().toISOString(), character: { name: character.name, realm: character.realm, region: character.region, contentVersion: character.contentVersion, realmType: character.realmType, level: character.level, race: character.race, class: character.class, spec: character.spec, equipment: character.equipment }, assumptions: analysis.assumptions, recommendations: analysis.recommendations, activities: analysis.activities };
}

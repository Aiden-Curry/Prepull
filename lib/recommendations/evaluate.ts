import type { NormalizedCharacter } from "../types.ts";
import { evaluateCuratedReference } from "../curated-gear/evaluate.ts";
import { getCharacterRecommendationSupport, loadRecommendationProfile } from "./registry.ts";

export function evaluateCharacterRecommendations(character: NormalizedCharacter, phase?: number) {
  const support = getCharacterRecommendationSupport(character);
  if (!support.supported) return undefined;
  const profile = loadRecommendationProfile(support.config);
  const setId = phase === undefined ? profile.defaultSetId : support.config.setIdByPhase[phase] ?? profile.defaultSetId;
  return evaluateCuratedReference(character, profile, setId, phase as 1 | 2 | 3 | 4 | 5 | 6 | undefined, support.config.candidates);
}

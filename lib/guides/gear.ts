import { recommendationRegistry, loadRecommendationProfile } from "../recommendations/registry.ts";
import { normalizedItemMetadata } from "../item-metadata/store.ts";
import { isAvailableInPhase, resolvedPhaseForSet, sourceForPhase } from "../curated-gear/availability.ts";

// Resolve accepted content at build time. Never score, decorate or mutate it here.
export function resolveGuideGear(specKey: string, phases: number[]) {
  const config = recommendationRegistry.find(entry => entry.key === specKey);
  if (!config) throw new Error(`Unknown guide recommendation reference: ${specKey}`);
  const profile = loadRecommendationProfile(config);
  const metadata = normalizedItemMetadata();
  return phases.map(phase => {
    const set = profile.sets.find(entry => entry.id === config.setIdByPhase[phase]);
    if (!set || set.status !== "published") throw new Error(`Unavailable guide gear phase: ${specKey}/${phase}`);
    const availabilityPhase = resolvedPhaseForSet(set.phase);
    return { set, slots: Object.entries(set.slots).map(([slot, entries]) => ({ slot, items: (entries ?? []).map(reference => {
      const item = config.candidates.find(candidate => candidate.itemId === reference.itemId) ?? metadata.get(reference.itemId);
      if (!item) throw new Error(`Unknown guide gear item: ${reference.itemId}`);
      return { item, reference: { ...reference, source: sourceForPhase(reference.itemId, availabilityPhase) ?? reference.source } };
    }).filter(({ item }) => isAvailableInPhase(item.itemId, availabilityPhase)) })).filter(slot => slot.items.length > 0) };
  });
}

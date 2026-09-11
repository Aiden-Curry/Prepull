# Recommendation registry and coupling audit

Phase 6.3E routes curated player recommendations through `lib/recommendations/registry.ts`. Each supported content/class/spec combination owns its profile, published phase-to-set mapping, candidates, and narrowly scoped presentation/decorator options.

The audit found direct Fury assumptions in PlayerAdvice support detection, generated-set repository normalization, evaluator candidate lookup, curated authoring validation, public character pages, dashboard status copy, and mock fixtures. These paths now resolve through the registry or through a profile passed by the resolved registry entry. Session Planner, activity detail, refresh persistence, and saved-character persistence already consumed normalized models and required no class-specific branch.

Fury-only weapon, race, dagger, Edgemaster, Aged Core Leather Gloves, and Black Dragon Mail rules remain intentionally isolated in the Fury dataset/decorator and evaluator context. They are not copied into Mage configuration. The legacy stat-scoring module in `lib/gear-analysis/engine.ts` remains Fury-specific and unchanged; Frost uses the curated-reference path and no Mage stat weights or DPS model were introduced.

Registry validation rejects duplicate content/class/spec identities, duplicate keys, missing published datasets, profile/content/spec mismatches, phase/set mismatches, empty datasets, and candidate content/class mismatches. Unsupported specs do not fall back to a neighboring registry entry.

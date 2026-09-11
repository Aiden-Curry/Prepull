# Recommendation content pipeline

## Authoring audit

Before Phase 6.3F, adding a specialization required coordinated edits to the registry, profile shell, candidate module, provenance registry, phase availability table, generated normalized data, snapshot metadata, fixtures, validators, tests, and documentation. Identity and phase metadata were repeated across several of those files. Snapshot creation was spec-specific and publication protection was procedural.

## Current workflow

1. Add one manifest under `lib/recommendations/manifests`. The manifest owns identity, level, role, phases, dataset versions, source CSV paths, snapshot paths and reviewed hashes, documentation, provenance, capabilities, and optional rules.
2. Author the spec’s candidate catalog and CSV rankings. Priority remains human-authored and non-numeric.
3. Add explicit phase availability and item metadata. For the second-wave specs these are derived from their candidate catalogs.
4. Import each CSV with `npm run curated:import -- --file=<path>`. The command validates before changing normalized generated data.
5. Run `npm run snapshot:spec -- <spec-key>` to preview deterministic snapshot and source hashes. For a new file, use `--write`; replacing an existing published file requires `--replace-published=<dataset-version>` after review.
6. Record the reviewed snapshot hashes in the manifest, then run `npm run validate:spec -- <spec-key>`.
7. Add deterministic fresh/partial/near-reference fixtures plus focused unit and representative browser coverage.
8. Run all-spec, curated, gear, unit, integration, browser, type, lint, and build gates before publishing.

The central registry is generated from manifests. The coverage UI and generated support document are derived from that registry. Methodology and provenance narratives remain human-authored.

Remaining manual work is intentional: item/source research, priority decisions, realistic-versus-aspirational classification, fixture selection, provenance review, and approval of published snapshot hashes. Tooling reports problems but never repairs or publishes authored data unattended.

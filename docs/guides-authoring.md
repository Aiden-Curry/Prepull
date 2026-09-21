# Guides authoring

P1D uses trusted, typed TypeScript content; there is no CMS, runtime filesystem discovery, user HTML, or database migration.

## Adding content

1. Research the correct game ecosystem first. Record source title, publisher, HTTPS URL and access date. Write original concise explanations; distinguish common strategies from mechanics. Check mixed Classic/seasonal pages carefully.
2. Author structured `GuideContent` under `content/guides/<version>/`. Blocks support paragraphs, lists, labelled callouts, verified item/spell references, guide references, central gear references and raid boss cards. Do not put prose in React components.
3. Register identity, slug, status and review date in `lib/guides/registry.ts`; wire the content by ID in `lib/guides/content.ts`. Start unpublished work as `draft`. Only `publishedGuides` feeds public routes, search, links and the sitemap. Unpublished and unknown direct routes return 404.
4. Use existing game registries. Molten Core identity comes from `ERA_RAIDS`, zone 2000, including encounter names, order and progression membership. Boss prose is keyed by encounter ID. Do not import seasonal zone 2012 or synthetic display IDs.
5. Use stable, unique section IDs. Internal references contain guide IDs, not handwritten route strings. Boss content includes its quick summary, mechanics, positioning, roles, preparation and related guides.
6. Gear blocks contain only recommendation key and phases. The resolver reads the published reference profile, existing candidate/item metadata, and accepted phase availability/source rules. It does not score or mutate data. Pre-Raid uses mature Era availability; Phase 1 uses the accepted Phase 1 filter. Preserve all accepted snapshots.
7. Run `npm run validate:guides`, `npm test`, typecheck, lint and build. Extend browser tests for new identities and publishing behavior. Normal guide validation is offline.

## Rendering and navigation

The optional catch-all under `app/[version]/guides` statically generates only manifest-derived paths, with `dynamicParams=false`. A public shell reuses Header/Footer without fetching sessions. No guide rendering imports character providers, WCL transports, guild repositories or authentication loaders. The client index receives only published manifest records and filters them locally.

The compact desktop navigation includes Guides; Menu retains all existing destinations. Switching versions within Guides returns to that version's Guides home, so an unpublished counterpart cannot masquerade as the current article. TBC has an explicit empty state and no Era fallback.

The shared article renderer owns breadcrumbs, sticky desktop TOC, native collapsible mobile TOC, section anchors, role sections and previous/next boss navigation. Existing `wowheadLink` and `WowheadTooltips` supply links and one script; text remains usable if the script is blocked. No HTML/MDX interpreter or raw HTML injection is used.

## Canonical origin

Set `PREPULL_SITE_URL` to the intended production origin before publishing Guides, for example your verified public site domain. It takes priority over `NEXTAUTH_URL`; the latter is the existing application-origin fallback, with localhost as the development fallback. Credentials, paths and non-HTTP(S) origins are rejected. Vercel deployment/preview hostnames are never inferred. Canonicals, Open Graph URLs and the guide sitemap share this abstraction. This phase does not choose or deploy a production domain.

Guides are indexable; character crawl directives are unchanged. No invented author, review organization or schema.org claims are emitted. Structured data and authenticated guide personalization are deferred. Guide pages intentionally render the same public content for every visitor.

## P1D source review

Each article's Sources footer lists the actual reviewed URLs. Fury research covers Wowhead Classic's overview, talents, stats, rotation and consumables, plus Icy Veins' Classic rotation and consumables. Raid research covers the Classic Molten Core overview and individual Icy Veins encounter pages; Wowhead's Garr, Baron Geddon, Golemagg, Majordomo and Ragnaros guides provide additional checks for those mechanics. Warcraft Tavern's raid overview was corroborated through indexed material; direct access returned 403 during review.

Seasonal paragraphs and loot from mixed pages were excluded. The wowtbc.gg page labelled Classic contained seasonal mechanics (including Magmakin, multiple bombs, Shazzrah images and a health-triggered submerge); it was rejected as an authoring source. Ragnaros uses the standard approximately three-minute transition. Majordomo's control transition is after four add deaths. The accepted navigation order places Shazzrah before Baron Geddon and is explicitly distinguished from a required pull order.

Talent presentation is a reviewed common 17/34/0 build outline with core talent goals and two verified one-point spell links; it is not a full calculator or an imported character's current allocation. Macros are omitted because this slice does not need an unverified macro library. Source access began on 2026-09-20 and continued on 2026-09-21; the final editorial review date is 2026-09-21.

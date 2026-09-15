# Public character lookup and abuse protection

P0B keeps anonymous discovery separate from trusted player state. A public request is validated, rate-limited, checked against the shared PostgreSQL cache, resolved through the existing `CharacterProvider`, and reduced to an explicit public projection. It never writes `user_characters`, `character_syncs`, or `character_sync_items`, and it never runs PlayerAdvice or Session Planner. Saving requires authentication and uses the existing authoritative provider re-resolution and persistence action.

Public URLs use `/{version}/characters/{realmType}/{region}/{realm}/{name}`. All identity dimensions are normalized before a canonical redirect. Character pages are dynamic, `noindex, nofollow`, and use private/no-store API responses so CDN caching cannot bypass application rate enforcement.

## Shared cache

`public_character_lookup_cache` is an expendable PostgreSQL cache shared by all Vercel functions. Keys are SHA-256 digests over content version, realm ecosystem, region, normalized realm, and normalized character name. Successful projections live for 10 minutes. Not-found results live for 45 seconds. Temporary provider, timeout, credential, and upstream rate-limit failures are not cached.

The provider's older in-process cache remains an internal optimization, but public correctness and quota protection rely on the PostgreSQL cache.

## Rate limits

`abuse_rate_limit_windows` provides atomic fixed-window counters shared across instances:

- Public lookup: 20 requests per 60 seconds per client.
- Signup: 5 attempts per 10 minutes per client and normalized account identifier.
- Credentials sign-in: 10 attempts per 10 minutes per client and normalized account identifier.

Client and account subjects are HMAC-SHA-256 derived with `ABUSE_CONTROL_SECRET`, falling back to the existing server-only `NEXTAUTH_SECRET`. Raw IP addresses, emails, and search text are never stored in limiter rows or logs. On Vercel, only `x-vercel-forwarded-for` is accepted as the client source; Vercel documents that it normalizes this header. Non-Vercel production fails closed. Local development has an explicit local identity fallback.

Blocked API/auth requests return HTTP 429, neutral wording, `Retry-After`, and `Cache-Control: private, no-store`. Limiting occurs before cache/provider access and before signup database/password work. A constant-time, server-configured `E2E_ABUSE_BYPASS_SECRET` is available only for established synthetic regression traffic; production has no implicit bypass.

Vercel WAF is available for coarse IP/path protection, but the project currently has no custom rules. PostgreSQL enforcement is authoritative because P0B also requires account-dimension policies, safe application responses, deterministic clock/store tests, and cache coordination. WAF can be added as defense in depth after observing production traffic without replacing these controls.

Privacy-safe logs contain only event category plus version, realm ecosystem, region, and outcome. They never include raw identity input, passwords, provider payloads, or secrets.

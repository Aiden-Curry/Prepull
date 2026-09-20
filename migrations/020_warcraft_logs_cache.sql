-- Public WCL display projections only. No account/character/guild foreign keys,
-- Blizzard snapshots, OAuth tokens, credentials, or raw ranking responses.
CREATE TABLE IF NOT EXISTS warcraft_logs_cache (
  cache_key text PRIMARY KEY,
  projection jsonb,
  fresh_until timestamptz,
  stale_until timestamptz,
  retry_after timestamptz,
  stale_allowed boolean NOT NULL DEFAULT false,
  lease_owner uuid,
  lease_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((projection IS NULL AND fresh_until IS NULL AND stale_until IS NULL)
    OR (jsonb_typeof(projection) = 'object' AND fresh_until IS NOT NULL AND stale_until >= fresh_until)),
  CHECK ((lease_owner IS NULL) = (lease_until IS NULL))
);
CREATE INDEX IF NOT EXISTS warcraft_logs_cache_expiry_idx ON warcraft_logs_cache (stale_until);

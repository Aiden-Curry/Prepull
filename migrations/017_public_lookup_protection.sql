CREATE TABLE public_character_lookup_cache (
  cache_key text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('found', 'not_found')),
  projection jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'found' AND projection IS NOT NULL) OR (status = 'not_found' AND projection IS NULL))
);

CREATE INDEX public_character_lookup_cache_expiry_idx
  ON public_character_lookup_cache(expires_at);

CREATE TABLE abuse_rate_limit_windows (
  bucket text NOT NULL,
  key_hash text NOT NULL CHECK (length(key_hash) = 64),
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (bucket, key_hash, window_started_at)
);

CREATE INDEX abuse_rate_limit_windows_expiry_idx
  ON abuse_rate_limit_windows(expires_at);

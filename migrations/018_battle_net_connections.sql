ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE battle_net_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_region text NOT NULL CHECK (provider_region IN ('eu', 'us')),
  provider_subject text NOT NULL,
  provider_account_id text,
  battle_tag text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  last_authorized_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_region, provider_subject),
  UNIQUE (user_id, provider_region)
);

CREATE INDEX battle_net_connections_user_idx ON battle_net_connections(user_id);

CREATE TABLE battle_net_oauth_states (
  state_hash text PRIMARY KEY CHECK (length(state_hash) = 64),
  browser_binding_hash text NOT NULL CHECK (length(browser_binding_hash) = 64),
  provider_region text NOT NULL CHECK (provider_region IN ('eu', 'us')),
  intent text NOT NULL CHECK (intent IN ('login', 'link')),
  initiating_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content_version text NOT NULL CHECK (content_version IN ('era', 'tbc')),
  callback_url text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((intent = 'login' AND initiating_user_id IS NULL) OR (intent = 'link' AND initiating_user_id IS NOT NULL))
);

CREATE INDEX battle_net_oauth_states_expiry_idx ON battle_net_oauth_states(expires_at);

CREATE TABLE battle_net_import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES battle_net_connections(id) ON DELETE CASCADE,
  content_version text NOT NULL CHECK (content_version IN ('era', 'tbc')),
  callback_url text NOT NULL,
  discovery_status text NOT NULL CHECK (discovery_status IN ('complete', 'era_unavailable')),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX battle_net_import_sessions_user_expiry_idx ON battle_net_import_sessions(user_id, expires_at);

CREATE TABLE battle_net_import_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_session_id uuid NOT NULL REFERENCES battle_net_import_sessions(id) ON DELETE CASCADE,
  provider_character_id text,
  character_name text NOT NULL,
  normalized_character_name text NOT NULL,
  realm_name text NOT NULL,
  realm_slug text NOT NULL,
  region text NOT NULL CHECK (region IN ('eu', 'us')),
  character_realm_type text NOT NULL CHECK (character_realm_type IN ('era', 'anniversary', 'unknown')),
  content_support text NOT NULL CHECK (content_support IN ('supported', 'unsupported', 'unavailable')),
  class_name text,
  race text,
  level integer CHECK (level IS NULL OR level BETWEEN 1 AND 100),
  import_status text NOT NULL DEFAULT 'pending' CHECK (import_status IN ('pending', 'importing', 'imported', 'already_added', 'failed', 'unsupported')),
  failure_code text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  saved_character_id uuid REFERENCES user_characters(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (import_session_id, region, realm_slug, normalized_character_name, character_realm_type)
);

CREATE INDEX battle_net_import_characters_session_idx ON battle_net_import_characters(import_session_id, import_status);

CREATE TABLE battle_net_login_grants (
  token_hash text PRIMARY KEY CHECK (length(token_hash) = 64),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  import_session_id uuid NOT NULL REFERENCES battle_net_import_sessions(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX battle_net_login_grants_expiry_idx ON battle_net_login_grants(expires_at);

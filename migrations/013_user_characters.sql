CREATE TABLE IF NOT EXISTS user_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region text NOT NULL CHECK (region IN ('eu', 'us')),
  realm_slug text NOT NULL,
  realm_name text NOT NULL,
  character_name text NOT NULL,
  normalized_character_name text NOT NULL,
  character_realm_type text NOT NULL CHECK (character_realm_type IN ('era', 'anniversary')),
  content_version text NOT NULL CHECK (content_version IN ('era', 'tbc')),
  class_name text NOT NULL DEFAULT 'Unavailable',
  level integer NOT NULL DEFAULT 0 CHECK (level >= 0),
  race text NOT NULL DEFAULT 'Unavailable',
  faction text NOT NULL DEFAULT 'Alliance' CHECK (faction IN ('Alliance', 'Horde')),
  last_synced_at timestamptz,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS user_characters_identity_idx
  ON user_characters(user_id, region, realm_slug, normalized_character_name, character_realm_type)
  WHERE archived_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_characters_primary_idx
  ON user_characters(user_id)
  WHERE is_primary = true AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS user_characters_user_idx ON user_characters(user_id, archived_at, updated_at DESC);

CREATE TABLE IF NOT EXISTS character_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_character_id uuid NOT NULL REFERENCES user_characters(id) ON DELETE CASCADE,
  synced_at timestamptz NOT NULL DEFAULT now(),
  level integer,
  class_name text,
  spec text,
  race text,
  faction text,
  professions jsonb NOT NULL DEFAULT '[]'::jsonb,
  talents jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_version text NOT NULL CHECK (content_version IN ('era', 'tbc')),
  character_realm_type text NOT NULL CHECK (character_realm_type IN ('era', 'anniversary')),
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  error_code text,
  error_message text
);

CREATE INDEX IF NOT EXISTS character_syncs_character_idx ON character_syncs(user_character_id, synced_at DESC);

CREATE TABLE IF NOT EXISTS character_sync_items (
  sync_id uuid NOT NULL REFERENCES character_syncs(id) ON DELETE CASCADE,
  slot text NOT NULL,
  item_id integer,
  item_name text NOT NULL,
  item_level integer,
  quality text NOT NULL,
  icon text NOT NULL,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  enchantments jsonb NOT NULL DEFAULT '[]'::jsonb,
  weapon jsonb,
  set_id text,
  special_effect_id text,
  unique_group text,
  source jsonb,
  PRIMARY KEY (sync_id, slot)
);

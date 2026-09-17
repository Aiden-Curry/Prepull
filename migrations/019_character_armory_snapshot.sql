-- Optional sections belong to the successful character snapshot, not a second sync system.
ALTER TABLE character_syncs ADD COLUMN IF NOT EXISTS armory jsonb;
ALTER TABLE character_sync_items ADD COLUMN IF NOT EXISTS enchant_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE character_sync_items ADD COLUMN IF NOT EXISTS gem_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

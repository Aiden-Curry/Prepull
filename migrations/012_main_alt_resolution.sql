ALTER TABLE guilds ADD COLUMN IF NOT EXISTS roster_version integer NOT NULL DEFAULT 1;
ALTER TABLE guild_members ADD CONSTRAINT guild_members_guild_id_id_key UNIQUE (guild_id, id);
ALTER TABLE guild_main_alt_relationships ADD CONSTRAINT main_alt_main_same_guild_fk FOREIGN KEY (guild_id, main_member_id) REFERENCES guild_members(guild_id, id);
ALTER TABLE guild_main_alt_relationships ADD CONSTRAINT main_alt_alt_same_guild_fk FOREIGN KEY (guild_id, alt_member_id) REFERENCES guild_members(guild_id, id);
CREATE TABLE IF NOT EXISTS guild_main_alt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), guild_id uuid NOT NULL REFERENCES guilds(id), alt_member_id uuid NOT NULL REFERENCES guild_members(id), previous_main_member_id uuid REFERENCES guild_members(id), new_main_member_id uuid REFERENCES guild_members(id), actor_user_id uuid REFERENCES users(id), source text NOT NULL CHECK (source IN ('CSV import','manual officer change')), decision text, import_id uuid, reason text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guild_main_alt_history_guild_idx ON guild_main_alt_history(guild_id, created_at DESC);

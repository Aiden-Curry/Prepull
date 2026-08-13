ALTER TABLE guilds ADD COLUMN IF NOT EXISTS raid_timezone text NOT NULL DEFAULT 'UTC';
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS default_content_version text;
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS default_availability_phase integer NOT NULL DEFAULT 6;
ALTER TABLE guilds ADD COLUMN IF NOT EXISTS internal_notes text NOT NULL DEFAULT '';
ALTER TABLE guild_workspace_memberships ADD COLUMN IF NOT EXISTS revoked_capabilities jsonb NOT NULL DEFAULT '[]';
CREATE INDEX IF NOT EXISTS guild_claim_status_idx ON guild_member_links(status, updated_at DESC);

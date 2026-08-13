CREATE OR REPLACE FUNCTION enforce_guild_owner_invariant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  guild_uuid uuid;
  expected_owner uuid;
  owner_count integer;
  archived timestamptz;
BEGIN
  IF TG_TABLE_NAME = 'guilds' THEN
    guild_uuid := COALESCE(NEW.id, OLD.id);
  ELSE
    guild_uuid := COALESCE(NEW.guild_id, OLD.guild_id);
  END IF;
  SELECT owner_user_id, archived_at INTO expected_owner, archived FROM guilds WHERE id = guild_uuid;
  IF NOT FOUND OR archived IS NOT NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  SELECT count(*) INTO owner_count FROM guild_workspace_memberships WHERE guild_id = guild_uuid AND role = 'owner' AND active = true;
  IF expected_owner IS NULL OR owner_count <> 1 OR NOT EXISTS (
    SELECT 1 FROM guild_workspace_memberships WHERE guild_id = guild_uuid AND user_id = expected_owner AND role = 'owner' AND active = true
  ) THEN
    RAISE EXCEPTION 'guild owner invariant violation' USING ERRCODE = '23514';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

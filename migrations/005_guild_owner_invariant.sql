-- owner_user_id on guilds is authoritative; owner membership is derived state.
-- Validate existing data before adding the invariant. Never repair owners silently.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM guilds g
    LEFT JOIN guild_workspace_memberships m
      ON m.guild_id = g.id AND m.user_id = g.owner_user_id AND m.role = 'owner' AND m.active = true
    WHERE g.archived_at IS NULL AND m.id IS NULL
  ) THEN
    RAISE EXCEPTION 'guild owner invariant violation: guild owner membership is missing';
  END IF;

  IF EXISTS (
    SELECT guild_id
    FROM guild_workspace_memberships
    WHERE role = 'owner' AND active = true
    GROUP BY guild_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'guild owner invariant violation: multiple active owners exist';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS guild_one_active_owner_idx
  ON guild_workspace_memberships(guild_id)
  WHERE role = 'owner' AND active = true;

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
  guild_uuid := COALESCE(NEW.guild_id, OLD.guild_id);
  SELECT owner_user_id, archived_at INTO expected_owner, archived FROM guilds WHERE id = guild_uuid;
  IF NOT FOUND OR archived IS NOT NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  SELECT count(*) INTO owner_count
  FROM guild_workspace_memberships
  WHERE guild_id = guild_uuid AND role = 'owner' AND active = true;

  IF expected_owner IS NULL OR owner_count <> 1 OR NOT EXISTS (
    SELECT 1 FROM guild_workspace_memberships
    WHERE guild_id = guild_uuid AND user_id = expected_owner AND role = 'owner' AND active = true
  ) THEN
    RAISE EXCEPTION 'guild owner invariant violation' USING ERRCODE = '23514';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS guild_owner_membership_integrity ON guild_workspace_memberships;
CREATE CONSTRAINT TRIGGER guild_owner_membership_integrity
AFTER INSERT OR UPDATE OR DELETE ON guild_workspace_memberships
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_guild_owner_invariant();

DROP TRIGGER IF EXISTS guild_owner_reference_integrity ON guilds;
CREATE CONSTRAINT TRIGGER guild_owner_reference_integrity
AFTER UPDATE OF owner_user_id ON guilds
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_guild_owner_invariant();

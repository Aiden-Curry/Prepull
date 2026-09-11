ALTER TABLE user_characters
  ADD CONSTRAINT user_characters_user_id_id_key UNIQUE (user_id, id);

CREATE TABLE guild_readiness_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL,
  guild_member_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_character_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  CONSTRAINT readiness_share_guild_member_fk
    FOREIGN KEY (guild_id, guild_member_id)
    REFERENCES guild_members(guild_id, id) ON DELETE CASCADE,
  CONSTRAINT readiness_share_membership_fk
    FOREIGN KEY (guild_id, user_id)
    REFERENCES guild_workspace_memberships(guild_id, user_id) ON DELETE CASCADE,
  CONSTRAINT readiness_share_claim_fk
    FOREIGN KEY (guild_member_id, user_id)
    REFERENCES guild_member_links(guild_member_id, user_id) ON DELETE CASCADE,
  CONSTRAINT readiness_share_owned_character_fk
    FOREIGN KEY (user_id, user_character_id)
    REFERENCES user_characters(user_id, id) ON DELETE CASCADE,
  CONSTRAINT readiness_share_enabled_state_check
    CHECK ((enabled AND disabled_at IS NULL) OR (NOT enabled AND disabled_at IS NOT NULL)),
  UNIQUE (guild_id, guild_member_id, user_character_id)
);

CREATE UNIQUE INDEX guild_readiness_shares_enabled_member_idx
  ON guild_readiness_shares(guild_id, guild_member_id)
  WHERE enabled;

CREATE INDEX guild_readiness_shares_user_idx
  ON guild_readiness_shares(user_id, enabled, updated_at DESC);

CREATE OR REPLACE FUNCTION disable_invalid_readiness_shares()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  row_data jsonb := to_jsonb(NEW);
BEGIN
  IF TG_TABLE_NAME = 'guild_member_links' AND row_data->>'status' <> 'approved' THEN
    UPDATE guild_readiness_shares
      SET enabled = false, disabled_at = now(), updated_at = now()
      WHERE guild_member_id = (row_data->>'guild_member_id')::uuid AND user_id = (row_data->>'user_id')::uuid AND enabled;
  ELSIF TG_TABLE_NAME = 'guild_workspace_memberships' AND NOT (row_data->>'active')::boolean THEN
    UPDATE guild_readiness_shares
      SET enabled = false, disabled_at = now(), updated_at = now()
      WHERE guild_id = (row_data->>'guild_id')::uuid AND user_id = (row_data->>'user_id')::uuid AND enabled;
  ELSIF TG_TABLE_NAME = 'guild_members' AND NOT (row_data->>'active')::boolean THEN
    UPDATE guild_readiness_shares
      SET enabled = false, disabled_at = now(), updated_at = now()
      WHERE guild_id = (row_data->>'guild_id')::uuid AND guild_member_id = (row_data->>'id')::uuid AND enabled;
  ELSIF TG_TABLE_NAME = 'user_characters' AND row_data->>'archived_at' IS NOT NULL THEN
    UPDATE guild_readiness_shares
      SET enabled = false, disabled_at = now(), updated_at = now()
      WHERE user_id = (row_data->>'user_id')::uuid AND user_character_id = (row_data->>'id')::uuid AND enabled;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER readiness_share_claim_invalidation
AFTER UPDATE OF status ON guild_member_links
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status <> 'approved')
EXECUTE FUNCTION disable_invalid_readiness_shares();

CREATE TRIGGER readiness_share_membership_invalidation
AFTER UPDATE OF active ON guild_workspace_memberships
FOR EACH ROW
WHEN (OLD.active IS DISTINCT FROM NEW.active AND NOT NEW.active)
EXECUTE FUNCTION disable_invalid_readiness_shares();

CREATE TRIGGER readiness_share_roster_invalidation
AFTER UPDATE OF active ON guild_members
FOR EACH ROW
WHEN (OLD.active IS DISTINCT FROM NEW.active AND NOT NEW.active)
EXECUTE FUNCTION disable_invalid_readiness_shares();

CREATE TRIGGER readiness_share_character_invalidation
AFTER UPDATE OF archived_at ON user_characters
FOR EACH ROW
WHEN (OLD.archived_at IS DISTINCT FROM NEW.archived_at AND NEW.archived_at IS NOT NULL)
EXECUTE FUNCTION disable_invalid_readiness_shares();

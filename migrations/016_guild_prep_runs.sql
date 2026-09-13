CREATE UNIQUE INDEX raid_events_guild_id_id_idx
  ON raid_events(guild_id, id);

CREATE UNIQUE INDEX guild_workspace_memberships_guild_id_id_idx
  ON guild_workspace_memberships(guild_id, id);

CREATE TABLE guild_prep_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  raid_id uuid NOT NULL,
  activity_key text NOT NULL CHECK (length(activity_key) BETWEEN 1 AND 240),
  activity_label text NOT NULL CHECK (length(activity_label) BETWEEN 1 AND 160),
  activity_category text NOT NULL CHECK (activity_category IN ('dungeon','quest','crafted','reputation','raid-alternative','other')),
  scheduled_for timestamptz,
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 280),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','cancelled','completed')),
  created_by_membership_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_prep_runs_guild_raid_fk
    FOREIGN KEY (guild_id, raid_id)
    REFERENCES raid_events(guild_id, id) ON DELETE CASCADE,
  CONSTRAINT guild_prep_runs_creator_membership_fk
    FOREIGN KEY (guild_id, created_by_membership_id)
    REFERENCES guild_workspace_memberships(guild_id, id)
    ON DELETE SET NULL (created_by_membership_id),
  UNIQUE (guild_id, id)
);

CREATE UNIQUE INDEX guild_prep_runs_one_open_activity_idx
  ON guild_prep_runs(guild_id, raid_id, activity_key)
  WHERE status = 'open';

CREATE INDEX guild_prep_runs_guild_status_schedule_idx
  ON guild_prep_runs(guild_id, status, scheduled_for NULLS LAST, created_at DESC);

CREATE TABLE guild_prep_run_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid NOT NULL,
  prep_run_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('going','maybe')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guild_prep_run_signups_run_fk
    FOREIGN KEY (guild_id, prep_run_id)
    REFERENCES guild_prep_runs(guild_id, id) ON DELETE CASCADE,
  CONSTRAINT guild_prep_run_signups_membership_fk
    FOREIGN KEY (guild_id, membership_id)
    REFERENCES guild_workspace_memberships(guild_id, id) ON DELETE CASCADE,
  UNIQUE (prep_run_id, membership_id)
);

CREATE INDEX guild_prep_run_signups_run_status_idx
  ON guild_prep_run_signups(prep_run_id, status, created_at);

CREATE OR REPLACE FUNCTION enforce_open_prep_run_signup()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM guild_prep_runs
    WHERE id = NEW.prep_run_id AND guild_id = NEW.guild_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Prep Run is not open' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guild_prep_run_signup_open_check
BEFORE INSERT OR UPDATE ON guild_prep_run_signups
FOR EACH ROW EXECUTE FUNCTION enforce_open_prep_run_signup();

CREATE OR REPLACE FUNCTION enforce_prep_run_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'open' AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Closed Prep Runs cannot change lifecycle state' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guild_prep_run_lifecycle_check
BEFORE UPDATE OF status ON guild_prep_runs
FOR EACH ROW EXECUTE FUNCTION enforce_prep_run_lifecycle();

CREATE OR REPLACE FUNCTION enforce_prep_run_identity_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.guild_id IS DISTINCT FROM NEW.guild_id
    OR OLD.raid_id IS DISTINCT FROM NEW.raid_id
    OR OLD.activity_key IS DISTINCT FROM NEW.activity_key
    OR OLD.activity_label IS DISTINCT FROM NEW.activity_label
    OR OLD.activity_category IS DISTINCT FROM NEW.activity_category THEN
    RAISE EXCEPTION 'Prep Run identity is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guild_prep_run_identity_immutable_check
BEFORE UPDATE ON guild_prep_runs
FOR EACH ROW EXECUTE FUNCTION enforce_prep_run_identity_immutable();

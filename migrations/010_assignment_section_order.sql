ALTER TABLE raid_assignments ADD COLUMN IF NOT EXISTS section_position integer NOT NULL DEFAULT 0;
UPDATE raid_assignments SET category = 'custom' WHERE category = 'general';
WITH ordered AS (
  SELECT id, dense_rank() OVER (PARTITION BY raid_event_id ORDER BY section, created_at) - 1 AS section_position
  FROM raid_assignments
)
UPDATE raid_assignments a SET section_position = ordered.section_position FROM ordered WHERE a.id = ordered.id;
CREATE INDEX IF NOT EXISTS raid_assignments_section_order_idx ON raid_assignments(raid_event_id, section_position, position, created_at);

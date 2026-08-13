ALTER TABLE audit_events ALTER COLUMN entity_id TYPE uuid USING entity_id::uuid;

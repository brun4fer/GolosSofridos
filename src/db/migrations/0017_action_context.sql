ALTER TABLE "actions"
  ADD COLUMN IF NOT EXISTS "context" text NOT NULL DEFAULT 'field_goal';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'actions_context_check'
  ) THEN
    ALTER TABLE "actions"
      ADD CONSTRAINT "actions_context_check" CHECK ("context" IN ('field','field_goal'));
  END IF;
END $$;

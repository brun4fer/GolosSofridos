DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = ANY(current_schemas(false))
      AND table_name = 'teams'
      AND column_name = 'emblem'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = ANY(current_schemas(false))
      AND table_name = 'teams'
      AND column_name = 'emblem_path'
  ) THEN
    ALTER TABLE "teams" RENAME COLUMN "emblem" TO "emblem_path";
  END IF;
END $$;

ALTER TABLE "teams"
  ADD COLUMN IF NOT EXISTS "emblem_path" text,
  ADD COLUMN IF NOT EXISTS "radiography_pdf_url" text,
  ADD COLUMN IF NOT EXISTS "video_report_url" text,
  ADD COLUMN IF NOT EXISTS "stadium" text,
  ADD COLUMN IF NOT EXISTS "pitch_dimensions" text,
  ADD COLUMN IF NOT EXISTS "pitch_rating" smallint,
  ADD COLUMN IF NOT EXISTS "coach" text,
  ADD COLUMN IF NOT EXISTS "president" text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = ANY(current_schemas(false))
      AND table_name = 'teams'
      AND column_name = 'emblem'
  ) THEN
    UPDATE "teams"
    SET "emblem_path" = "emblem"
    WHERE "emblem_path" IS NULL
      AND "emblem" IS NOT NULL;
  END IF;
END $$;

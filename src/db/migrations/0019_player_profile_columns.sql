DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = ANY(current_schemas(false))
      AND table_name = 'players'
      AND column_name = 'photo_url'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = ANY(current_schemas(false))
      AND table_name = 'players'
      AND column_name = 'photo_path'
  ) THEN
    ALTER TABLE "players" RENAME COLUMN "photo_url" TO "photo_path";
  END IF;
END $$;

ALTER TABLE "players"
  ADD COLUMN IF NOT EXISTS "photo_path" text,
  ADD COLUMN IF NOT EXISTS "primary_position" text,
  ADD COLUMN IF NOT EXISTS "secondary_position" text,
  ADD COLUMN IF NOT EXISTS "tertiary_position" text,
  ADD COLUMN IF NOT EXISTS "dominant_foot" text,
  ADD COLUMN IF NOT EXISTS "height_cm" smallint,
  ADD COLUMN IF NOT EXISTS "weight_kg" smallint;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = ANY(current_schemas(false))
      AND table_name = 'players'
      AND column_name = 'photo_url'
  ) THEN
    UPDATE "players"
    SET "photo_path" = "photo_url"
    WHERE "photo_path" IS NULL
      AND "photo_url" IS NOT NULL;
  END IF;
END $$;

UPDATE "players"
SET "primary_position" = 'N/D'
WHERE "primary_position" IS NULL;

ALTER TABLE "players"
  ALTER COLUMN "primary_position" SET NOT NULL;

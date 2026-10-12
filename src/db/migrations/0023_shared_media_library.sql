DO $$
BEGIN
  ALTER TABLE "goals" DROP CONSTRAINT IF EXISTS "goals_media_asset_id_media_assets_id_fk";

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'goals'
      AND column_name = 'media_asset_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE "goals"
      ALTER COLUMN "media_asset_id" TYPE text
      USING "media_asset_id"::text;
  END IF;
END $$;

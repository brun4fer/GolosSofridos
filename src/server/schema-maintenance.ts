import { sql } from "drizzle-orm";
import { db } from "../db/client";

export async function ensureActionsContextColumn() {
  await db.execute(sql`
    ALTER TABLE "actions"
      ADD COLUMN IF NOT EXISTS "context" text NOT NULL DEFAULT 'field_goal'
  `);

  await db.execute(sql`
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
  `);
}

export async function ensureTeamMetadataColumns() {
  await db.execute(sql`
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
  `);

  await db.execute(sql`
    ALTER TABLE "teams"
      ADD COLUMN IF NOT EXISTS "emblem_path" text,
      ADD COLUMN IF NOT EXISTS "radiography_pdf_url" text,
      ADD COLUMN IF NOT EXISTS "video_report_url" text,
      ADD COLUMN IF NOT EXISTS "stadium" text,
      ADD COLUMN IF NOT EXISTS "pitch_dimensions" text,
      ADD COLUMN IF NOT EXISTS "pitch_rating" smallint,
      ADD COLUMN IF NOT EXISTS "coach" text,
      ADD COLUMN IF NOT EXISTS "president" text
  `);

  await db.execute(sql`
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
  `);
}

export async function ensurePlayerProfileColumns() {
  await db.execute(sql`
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
  `);

  await db.execute(sql`
    ALTER TABLE "players"
      ADD COLUMN IF NOT EXISTS "photo_path" text,
      ADD COLUMN IF NOT EXISTS "primary_position" text,
      ADD COLUMN IF NOT EXISTS "secondary_position" text,
      ADD COLUMN IF NOT EXISTS "tertiary_position" text,
      ADD COLUMN IF NOT EXISTS "dominant_foot" text,
      ADD COLUMN IF NOT EXISTS "height_cm" smallint,
      ADD COLUMN IF NOT EXISTS "weight_kg" smallint
  `);

  await db.execute(sql`
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
  `);

  await db.execute(sql`
    UPDATE "players"
    SET "primary_position" = 'N/D'
    WHERE "primary_position" IS NULL
  `);

  await db.execute(sql`
    ALTER TABLE "players"
      ALTER COLUMN "primary_position" SET NOT NULL
  `);
}

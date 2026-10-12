BEGIN;

CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "slug" varchar(80) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_slug_unique" ON "workspaces" ("slug");

CREATE TABLE IF NOT EXISTS "users" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "username" varchar(80) NOT NULL,
  "password_hash" text NOT NULL,
  "workspace_id" bigint NOT NULL REFERENCES "workspaces"("id") ON DELETE RESTRICT,
  "must_change_password" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique" ON "users" (lower("username"));
CREATE INDEX IF NOT EXISTS "users_workspace_id_idx" ON "users" ("workspace_id");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "user_id" bigint NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_unique" ON "sessions" ("token_hash");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" ("expires_at");

ALTER TABLE "seasons" ADD COLUMN IF NOT EXISTS "workspace_id" bigint;
ALTER TABLE "championships" ADD COLUMN IF NOT EXISTS "workspace_id" bigint;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "workspace_id" bigint;
ALTER TABLE "actions" ADD COLUMN IF NOT EXISTS "workspace_id" bigint;
ALTER TABLE "actions" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "actions" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "seasons" WHERE "workspace_id" IS NULL)
     OR EXISTS (SELECT 1 FROM "championships" WHERE "workspace_id" IS NULL)
     OR EXISTS (SELECT 1 FROM "teams" WHERE "workspace_id" IS NULL) THEN
    RAISE EXCEPTION 'Football catalogue must be empty before workspace migration';
  END IF;
END $$;

ALTER TABLE "seasons" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "championships" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "teams" ALTER COLUMN "workspace_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seasons_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE "seasons" ADD CONSTRAINT "seasons_workspace_id_workspaces_id_fk"
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championships_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE "championships" ADD CONSTRAINT "championships_workspace_id_workspaces_id_fk"
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE "teams" ADD CONSTRAINT "teams_workspace_id_workspaces_id_fk"
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'actions_workspace_id_workspaces_id_fk') THEN
    ALTER TABLE "actions" ADD CONSTRAINT "actions_workspace_id_workspaces_id_fk"
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE "seasons" DROP CONSTRAINT IF EXISTS "seasons_name_key";
ALTER TABLE "seasons" DROP CONSTRAINT IF EXISTS "seasons_name_unique";
DROP INDEX IF EXISTS "seasons_name_key";
DROP INDEX IF EXISTS "teams_name_key";
DROP INDEX IF EXISTS "actions_sub_moment_name_key";

CREATE INDEX IF NOT EXISTS "idx_seasons_workspace" ON "seasons" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_championships_workspace" ON "championships" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_teams_workspace" ON "teams" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_actions_workspace" ON "actions" ("workspace_id");
CREATE UNIQUE INDEX IF NOT EXISTS "seasons_name_workspace_unique" ON "seasons" ("name", "workspace_id");
CREATE UNIQUE INDEX IF NOT EXISTS "teams_name_workspace_championship_unique"
  ON "teams" ("name", "workspace_id", "championship_id");
CREATE UNIQUE INDEX IF NOT EXISTS "actions_global_sub_moment_name_unique"
  ON "actions" ("sub_moment_id", lower("name")) WHERE "workspace_id" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "actions_workspace_sub_moment_name_unique"
  ON "actions" ("workspace_id", "sub_moment_id", lower("name")) WHERE "workspace_id" IS NOT NULL;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY sub_moment_id, workspace_id ORDER BY id) AS position
  FROM "actions"
)
UPDATE "actions" a
SET "sort_order" = ranked.position
FROM ranked
WHERE ranked.id = a.id AND a."sort_order" = 0;

ALTER TABLE "goals" ALTER COLUMN "sub_moment_id" DROP NOT NULL;
ALTER TABLE "goals" ALTER COLUMN "action_id" DROP NOT NULL;
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "attack_direction" text DEFAULT 'left_to_right' NOT NULL;
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "media_asset_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goals_attack_direction_check') THEN
    ALTER TABLE "goals" ADD CONSTRAINT "goals_attack_direction_check"
      CHECK ("attack_direction" IN ('left_to_right', 'right_to_left'));
  END IF;
END $$;

DROP INDEX IF EXISTS "goal_sub_moment_actions_goal_sequence_key";
DROP INDEX IF EXISTS "goal_sub_moment_actions_goal_sub_moment_key";
CREATE UNIQUE INDEX IF NOT EXISTS "goal_sub_moment_actions_goal_sub_moment_action_key"
  ON "goal_sub_moment_actions" ("goal_id", "sub_moment_id", "action_id");
CREATE INDEX IF NOT EXISTS "idx_goal_sub_moment_actions_goal_sequence"
  ON "goal_sub_moment_actions" ("goal_id", "sequence_order");

CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" uuid PRIMARY KEY NOT NULL,
  "workspace_id" bigint NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "file_name" varchar(255) NOT NULL,
  "file_size" bigint NOT NULL,
  "duration_seconds" integer DEFAULT 0 NOT NULL,
  "mime_type" varchar(120) NOT NULL,
  "storage_key" text NOT NULL,
  "storage_status" varchar(20) DEFAULT 'UPLOADING' NOT NULL,
  "etag" text,
  "uploaded_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "media_assets_storage_status_check" CHECK ("storage_status" IN ('UPLOADING','READY','FAILED'))
);
CREATE INDEX IF NOT EXISTS "idx_media_assets_workspace" ON "media_assets" ("workspace_id");
CREATE UNIQUE INDEX IF NOT EXISTS "media_assets_storage_key_unique" ON "media_assets" ("storage_key");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goals_media_asset_id_media_assets_id_fk') THEN
    ALTER TABLE "goals" ADD CONSTRAINT "goals_media_asset_id_media_assets_id_fk"
      FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "idx_goals_media_asset" ON "goals" ("media_asset_id");

COMMIT;

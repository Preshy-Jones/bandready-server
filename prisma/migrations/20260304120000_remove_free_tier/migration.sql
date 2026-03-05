-- Remove free tier: change default and migrate existing users
ALTER TABLE "users" ALTER COLUMN "subscription_tier" SET DEFAULT 'none';
UPDATE "users" SET "subscription_tier" = 'none' WHERE "subscription_tier" = 'free';

-- Drop daily session tracking columns
ALTER TABLE "users" DROP COLUMN "daily_speaking_used";
ALTER TABLE "users" DROP COLUMN "daily_sessions_reset_at";

-- AlterTable: add practice_filters to reading_sessions
ALTER TABLE "reading_sessions" ADD COLUMN "practice_filters" JSONB;

-- AlterTable: add ai_analysis and completion_reason to reading_results
ALTER TABLE "reading_results" ADD COLUMN "ai_analysis" JSONB;
ALTER TABLE "reading_results" ADD COLUMN "completion_reason" TEXT;

-- CreateTable
CREATE TABLE "reading_achievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reading_achievements_user_id_idx" ON "reading_achievements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reading_achievements_user_id_achievement_id_key" ON "reading_achievements"("user_id", "achievement_id");

-- AddForeignKey
ALTER TABLE "reading_achievements" ADD CONSTRAINT "reading_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

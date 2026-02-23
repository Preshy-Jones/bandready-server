-- AlterTable
ALTER TABLE "practice_sessions" ADD COLUMN     "mock_test_id" TEXT,
ADD COLUMN     "question_number" INTEGER;

-- CreateTable
CREATE TABLE "mock_tests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "timing_mode" TEXT NOT NULL DEFAULT 'flexible',
    "current_part" INTEGER NOT NULL DEFAULT 1,
    "current_question" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "overall_score" DECIMAL(2,1),
    "cross_part_analysis" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "mock_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mock_tests_user_id_completed_at_idx" ON "mock_tests"("user_id", "completed_at" DESC);

-- CreateIndex
CREATE INDEX "practice_sessions_mock_test_id_idx" ON "practice_sessions"("mock_test_id");

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_mock_test_id_fkey" FOREIGN KEY ("mock_test_id") REFERENCES "mock_tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

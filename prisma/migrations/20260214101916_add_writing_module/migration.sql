-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('TASK1', 'TASK2');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('DIAGNOSTIC', 'PRACTICE', 'DRILL', 'EXAM_SIMULATION');

-- CreateEnum
CREATE TYPE "WeaknessCategory" AS ENUM ('GRAMMAR', 'VOCABULARY', 'COHERENCE', 'TASK_RESPONSE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ImprovementStatus" AS ENUM ('IMPROVING', 'STAGNANT', 'WORSENING');

-- CreateEnum
CREATE TYPE "DrillType" AS ENUM ('MICRO_DRILL', 'TASK1_TRACK', 'TASK2_TRACK');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "writing_questions" (
    "id" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "subType" TEXT,
    "prompt" TEXT NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "writing_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "essay_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "essay_text" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "time_spent_seconds" INTEGER NOT NULL,
    "task_response_score" DECIMAL(2,1),
    "coherence_cohesion_score" DECIMAL(2,1),
    "lexical_resource_score" DECIMAL(2,1),
    "grammar_accuracy_score" DECIMAL(2,1),
    "overall_band_score" DECIMAL(2,1),
    "session_type" "SessionType" NOT NULL DEFAULT 'PRACTICE',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "essay_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "essay_feedback" (
    "id" TEXT NOT NULL,
    "essay_id" TEXT NOT NULL,
    "task_response_feedback" TEXT NOT NULL,
    "coherence_cohesion_feedback" TEXT NOT NULL,
    "lexical_resource_feedback" TEXT NOT NULL,
    "grammar_accuracy_feedback" TEXT NOT NULL,
    "overall_feedback" TEXT NOT NULL,
    "annotations" JSONB NOT NULL,
    "examiner_insights" JSONB NOT NULL,
    "priority_fixes" JSONB NOT NULL,
    "detected_errors" JSONB NOT NULL,
    "vocabulary_suggestions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "essay_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_weaknesses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "WeaknessCategory" NOT NULL,
    "specific_error" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "sessions_without_error" INTEGER NOT NULL DEFAULT 0,
    "status" "ImprovementStatus" NOT NULL DEFAULT 'STAGNANT',
    "last_occurrence" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_weaknesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_drills" (
    "id" TEXT NOT NULL,
    "type" "DrillType" NOT NULL,
    "category" "WeaknessCategory" NOT NULL,
    "specific_skill" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "time_limit" INTEGER,
    "related_weaknesses" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "writing_drills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drill_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "drill_id" TEXT NOT NULL,
    "user_answer" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "time_spent_seconds" INTEGER,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drill_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_essays" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "essay_text" TEXT NOT NULL,
    "band_score" DECIMAL(2,1) NOT NULL,
    "strong_phrases" JSONB NOT NULL,
    "structure_notes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_essays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "writing_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "avg_overall_score" DECIMAL(3,2),
    "avg_task_response" DECIMAL(3,2),
    "avg_coherence" DECIMAL(3,2),
    "avg_lexical" DECIMAL(3,2),
    "avg_grammar" DECIMAL(3,2),
    "avg_task1_score" DECIMAL(3,2),
    "avg_task2_score" DECIMAL(3,2),
    "total_essays" INTEGER NOT NULL DEFAULT 0,
    "total_drills_completed" INTEGER NOT NULL DEFAULT 0,
    "total_practice_minutes" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "milestones" JSONB NOT NULL DEFAULT '[]',
    "exam_ready_task1" BOOLEAN NOT NULL DEFAULT false,
    "exam_ready_task2" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writing_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "writing_questions_taskType_subType_idx" ON "writing_questions"("taskType", "subType");

-- CreateIndex
CREATE INDEX "essay_submissions_user_id_submitted_at_idx" ON "essay_submissions"("user_id", "submitted_at" DESC);

-- CreateIndex
CREATE INDEX "essay_submissions_overall_band_score_idx" ON "essay_submissions"("overall_band_score");

-- CreateIndex
CREATE UNIQUE INDEX "essay_feedback_essay_id_key" ON "essay_feedback"("essay_id");

-- CreateIndex
CREATE INDEX "writing_weaknesses_user_id_severity_idx" ON "writing_weaknesses"("user_id", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "writing_weaknesses_user_id_specific_error_key" ON "writing_weaknesses"("user_id", "specific_error");

-- CreateIndex
CREATE INDEX "writing_drills_type_category_difficulty_idx" ON "writing_drills"("type", "category", "difficulty");

-- CreateIndex
CREATE INDEX "drill_attempts_user_id_drill_id_idx" ON "drill_attempts"("user_id", "drill_id");

-- CreateIndex
CREATE INDEX "drill_attempts_user_id_attempted_at_idx" ON "drill_attempts"("user_id", "attempted_at" DESC);

-- CreateIndex
CREATE INDEX "model_essays_question_id_idx" ON "model_essays"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "writing_progress_user_id_key" ON "writing_progress"("user_id");

-- AddForeignKey
ALTER TABLE "essay_submissions" ADD CONSTRAINT "essay_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essay_submissions" ADD CONSTRAINT "essay_submissions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "writing_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essay_feedback" ADD CONSTRAINT "essay_feedback_essay_id_fkey" FOREIGN KEY ("essay_id") REFERENCES "essay_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_weaknesses" ADD CONSTRAINT "writing_weaknesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drill_attempts" ADD CONSTRAINT "drill_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drill_attempts" ADD CONSTRAINT "drill_attempts_drill_id_fkey" FOREIGN KEY ("drill_id") REFERENCES "writing_drills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_essays" ADD CONSTRAINT "model_essays_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "writing_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "writing_progress" ADD CONSTRAINT "writing_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

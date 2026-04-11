-- Create enums
CREATE TYPE "ReadingDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "ReadingTestType" AS ENUM ('ACADEMIC', 'GENERAL_TRAINING');
CREATE TYPE "ReadingSessionMode" AS ENUM ('FULL_TEST', 'SINGLE_PASSAGE', 'QUESTION_TYPE_PRACTICE', 'REVIEW');
CREATE TYPE "ReadingQuestionType" AS ENUM (
  'MULTIPLE_CHOICE',
  'TRUE_FALSE_NOT_GIVEN',
  'YES_NO_NOT_GIVEN',
  'MATCHING_HEADINGS',
  'MATCHING_INFORMATION',
  'MATCHING_FEATURES',
  'MATCHING_SENTENCE_ENDINGS',
  'SENTENCE_COMPLETION',
  'SUMMARY_COMPLETION',
  'SHORT_ANSWER',
  'DIAGRAM_LABEL'
);

-- Create tables
CREATE TABLE "reading_passages" (
  "id" TEXT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "word_count" INTEGER NOT NULL,
  "difficulty_level" "ReadingDifficulty" NOT NULL,
  "test_type" "ReadingTestType" NOT NULL,
  "topic_category" VARCHAR(100) NOT NULL,
  "source_attribution" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reading_passages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "passage_paragraphs" (
  "id" TEXT NOT NULL,
  "passage_id" TEXT NOT NULL,
  "paragraph_index" INTEGER NOT NULL,
  "label" VARCHAR(5) NOT NULL,
  "content" TEXT NOT NULL,

  CONSTRAINT "passage_paragraphs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reading_question_sets" (
  "id" TEXT NOT NULL,
  "passage_id" TEXT NOT NULL,
  "question_type" "ReadingQuestionType" NOT NULL,
  "instructions" TEXT NOT NULL,
  "question_range_start" INTEGER NOT NULL,
  "question_range_end" INTEGER NOT NULL,
  "set_data" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reading_question_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reading_questions" (
  "id" TEXT NOT NULL,
  "passage_id" TEXT NOT NULL,
  "question_set_id" TEXT,
  "question_type" "ReadingQuestionType" NOT NULL,
  "question_number" INTEGER NOT NULL,
  "question_data" JSONB NOT NULL,
  "correct_answer" JSONB NOT NULL,
  "explanation" TEXT,
  "skill_tested" VARCHAR(100),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reading_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reading_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "test_type" "ReadingTestType" NOT NULL,
  "mode" "ReadingSessionMode" NOT NULL,
  "is_timed" BOOLEAN NOT NULL DEFAULT true,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "time_spent_seconds" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reading_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reading_session_passages" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "passage_id" TEXT NOT NULL,
  "passage_order" INTEGER NOT NULL,
  "time_spent_seconds" INTEGER,

  CONSTRAINT "reading_session_passages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reading_answers" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "user_answer" JSONB NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "time_spent_seconds" INTEGER,
  "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reading_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reading_results" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "raw_score" INTEGER NOT NULL,
  "total_questions" INTEGER NOT NULL,
  "band_score" DECIMAL(3,1) NOT NULL,
  "question_type_breakdown" JSONB,
  "skill_breakdown" JSONB,
  "time_management" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reading_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reading_progress" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "question_type" "ReadingQuestionType" NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "correct" INTEGER NOT NULL DEFAULT 0,
  "accuracy_rate" DECIMAL(5,2),
  "last_practiced_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "reading_passages_difficulty_level_idx" ON "reading_passages"("difficulty_level");
CREATE INDEX "reading_passages_test_type_idx" ON "reading_passages"("test_type");
CREATE INDEX "reading_passages_topic_category_idx" ON "reading_passages"("topic_category");
CREATE INDEX "reading_question_sets_passage_id_question_type_idx" ON "reading_question_sets"("passage_id", "question_type");
CREATE INDEX "reading_questions_passage_id_idx" ON "reading_questions"("passage_id");
CREATE INDEX "reading_questions_question_type_idx" ON "reading_questions"("question_type");
CREATE INDEX "reading_sessions_user_id_created_at_idx" ON "reading_sessions"("user_id", "created_at" DESC);
CREATE INDEX "reading_sessions_completed_at_idx" ON "reading_sessions"("completed_at");
CREATE INDEX "reading_session_passages_passage_id_idx" ON "reading_session_passages"("passage_id");
CREATE INDEX "reading_answers_session_id_idx" ON "reading_answers"("session_id");
CREATE INDEX "reading_results_session_id_idx" ON "reading_results"("session_id");
CREATE INDEX "reading_progress_user_id_idx" ON "reading_progress"("user_id");

-- Create unique constraints
CREATE UNIQUE INDEX "passage_paragraphs_passage_id_paragraph_index_key" ON "passage_paragraphs"("passage_id", "paragraph_index");
CREATE UNIQUE INDEX "passage_paragraphs_passage_id_label_key" ON "passage_paragraphs"("passage_id", "label");
CREATE UNIQUE INDEX "reading_questions_passage_id_question_number_key" ON "reading_questions"("passage_id", "question_number");
CREATE UNIQUE INDEX "reading_session_passages_session_id_passage_order_key" ON "reading_session_passages"("session_id", "passage_order");
CREATE UNIQUE INDEX "reading_answers_session_id_question_id_key" ON "reading_answers"("session_id", "question_id");
CREATE UNIQUE INDEX "reading_progress_user_id_question_type_key" ON "reading_progress"("user_id", "question_type");

-- Add foreign keys
ALTER TABLE "passage_paragraphs"
ADD CONSTRAINT "passage_paragraphs_passage_id_fkey"
FOREIGN KEY ("passage_id") REFERENCES "reading_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_question_sets"
ADD CONSTRAINT "reading_question_sets_passage_id_fkey"
FOREIGN KEY ("passage_id") REFERENCES "reading_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_questions"
ADD CONSTRAINT "reading_questions_passage_id_fkey"
FOREIGN KEY ("passage_id") REFERENCES "reading_passages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_questions"
ADD CONSTRAINT "reading_questions_question_set_id_fkey"
FOREIGN KEY ("question_set_id") REFERENCES "reading_question_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reading_sessions"
ADD CONSTRAINT "reading_sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_session_passages"
ADD CONSTRAINT "reading_session_passages_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "reading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_session_passages"
ADD CONSTRAINT "reading_session_passages_passage_id_fkey"
FOREIGN KEY ("passage_id") REFERENCES "reading_passages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reading_answers"
ADD CONSTRAINT "reading_answers_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "reading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_answers"
ADD CONSTRAINT "reading_answers_question_id_fkey"
FOREIGN KEY ("question_id") REFERENCES "reading_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reading_results"
ADD CONSTRAINT "reading_results_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "reading_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_progress"
ADD CONSTRAINT "reading_progress_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

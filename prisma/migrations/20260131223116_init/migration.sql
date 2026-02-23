-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT,
    "google_id" TEXT,
    "avatar_url" TEXT,
    "target_band_score" DECIMAL(2,1) NOT NULL DEFAULT 7.0,
    "target_exam_date" TIMESTAMP(3),
    "native_language" TEXT,
    "country" TEXT,
    "subscription_tier" TEXT NOT NULL DEFAULT 'free',
    "subscription_expires_at" TIMESTAMP(3),
    "paystack_customer_code" TEXT,
    "daily_sessions_used" INTEGER NOT NULL DEFAULT 0,
    "daily_sessions_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speaking_questions" (
    "id" TEXT NOT NULL,
    "part" INTEGER NOT NULL,
    "topic" VARCHAR(100) NOT NULL,
    "question_text" TEXT NOT NULL,
    "cue_card_points" JSONB,
    "related_part2_topic" VARCHAR(100),
    "difficulty_level" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speaking_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "part" INTEGER NOT NULL,
    "audio_url" TEXT,
    "audio_duration_seconds" DECIMAL(6,2),
    "transcript" TEXT,
    "transcript_with_timestamps" JSONB,
    "overall_band_score" DECIMAL(2,1),
    "fluency_coherence_score" DECIMAL(2,1),
    "lexical_resource_score" DECIMAL(2,1),
    "grammar_accuracy_score" DECIMAL(2,1),
    "pronunciation_score" DECIMAL(2,1),
    "words_per_minute" DECIMAL(5,2),
    "total_words" INTEGER,
    "filler_word_count" INTEGER,
    "filler_words_detail" JSONB,
    "pause_count" INTEGER,
    "long_pause_count" INTEGER,
    "pause_locations" JSONB,
    "feedback_fluency" TEXT,
    "feedback_vocabulary" TEXT,
    "feedback_grammar" TEXT,
    "feedback_pronunciation" TEXT,
    "feedback_overall" TEXT,
    "vocabulary_suggestions" JSONB,
    "grammar_corrections" JSONB,
    "mispronounced_words" JSONB,
    "model_answer" TEXT,
    "prep_time_used_seconds" INTEGER,
    "speaking_time_seconds" DECIMAL(6,2),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "avg_overall_score" DECIMAL(3,2),
    "avg_fluency_score" DECIMAL(3,2),
    "avg_lexical_score" DECIMAL(3,2),
    "avg_grammar_score" DECIMAL(3,2),
    "avg_pronunciation_score" DECIMAL(3,2),
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_practice_minutes" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "current_streak_days" INTEGER NOT NULL DEFAULT 0,
    "longest_streak_days" INTEGER NOT NULL DEFAULT 0,
    "last_practice_date" TIMESTAMP(3),
    "weak_areas" JSONB,
    "strong_areas" JSONB,
    "part1_avg_score" DECIMAL(3,2),
    "part2_avg_score" DECIMAL(3,2),
    "part3_avg_score" DECIMAL(3,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "speaking_questions_part_topic_idx" ON "speaking_questions"("part", "topic");

-- CreateIndex
CREATE INDEX "practice_sessions_user_id_created_at_idx" ON "practice_sessions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "practice_sessions_part_idx" ON "practice_sessions"("part");

-- CreateIndex
CREATE INDEX "practice_sessions_overall_band_score_idx" ON "practice_sessions"("overall_band_score");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_key" ON "user_progress"("user_id");

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "speaking_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

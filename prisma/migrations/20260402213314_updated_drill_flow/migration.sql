/*
  Warnings:

  - Added the required column `updated_at` to the `writing_drills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "writing_drills" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "drill_review_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "drill_id" TEXT NOT NULL,
    "next_review_at" TIMESTAMP(3) NOT NULL,
    "interval_days" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "consecutive_correct" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drill_review_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drill_review_queue_user_id_next_review_at_idx" ON "drill_review_queue"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "drill_review_queue_user_id_drill_id_key" ON "drill_review_queue"("user_id", "drill_id");

-- AddForeignKey
ALTER TABLE "drill_review_queue" ADD CONSTRAINT "drill_review_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drill_review_queue" ADD CONSTRAINT "drill_review_queue_drill_id_fkey" FOREIGN KEY ("drill_id") REFERENCES "writing_drills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

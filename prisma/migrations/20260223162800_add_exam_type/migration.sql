-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('ACADEMIC', 'GENERAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "exam_type" "ExamType" NOT NULL DEFAULT 'ACADEMIC';

-- AlterTable
ALTER TABLE "writing_questions" ADD COLUMN "exam_type" "ExamType" NOT NULL DEFAULT 'ACADEMIC';

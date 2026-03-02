/*
  Warnings:

  - You are about to drop the column `daily_sessions_used` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `session_balance` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "daily_sessions_used",
DROP COLUMN "session_balance",
ADD COLUMN     "daily_speaking_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "speaking_balance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "writing_balance" INTEGER NOT NULL DEFAULT 0;

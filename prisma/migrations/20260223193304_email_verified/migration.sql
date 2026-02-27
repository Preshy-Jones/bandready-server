-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_otp" TEXT,
ADD COLUMN     "email_verification_otp_expiry" TIMESTAMP(3),
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "session_balance" INTEGER NOT NULL DEFAULT 0;

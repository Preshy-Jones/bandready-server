-- AlterTable
ALTER TABLE "users" ADD COLUMN "credit_balance" INTEGER NOT NULL DEFAULT 0;

-- Migrate existing balances: speaking * 5 + writing * 2
UPDATE "users"
SET "credit_balance" = ("speaking_balance" * 5) + ("writing_balance" * 2)
WHERE "speaking_balance" > 0 OR "writing_balance" > 0;

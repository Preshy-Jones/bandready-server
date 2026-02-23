/*
  Warnings:

  - A unique constraint covering the columns `[paddle_transaction_id]` on the table `payment_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "amount_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paddle_transaction_id" TEXT,
ALTER COLUMN "amount_kobo" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "paddle_customer_id" TEXT,
ADD COLUMN     "paddle_subscription_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_paddle_transaction_id_key" ON "payment_transactions"("paddle_transaction_id");

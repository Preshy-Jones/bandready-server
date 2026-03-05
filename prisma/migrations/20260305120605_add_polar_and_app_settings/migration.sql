-- AlterTable
ALTER TABLE "users" ADD COLUMN     "polar_customer_id" TEXT;

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "polar_checkout_id" TEXT;

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_polar_checkout_id_key" ON "payment_transactions"("polar_checkout_id");

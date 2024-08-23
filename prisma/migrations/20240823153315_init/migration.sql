/*
  Warnings:

  - You are about to drop the `PaymentHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PaymentHistory" DROP CONSTRAINT "PaymentHistory_paymentAccountId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentHistory" DROP CONSTRAINT "PaymentHistory_transactionId_fkey";

-- DropTable
DROP TABLE "PaymentHistory";

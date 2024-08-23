/*
  Warnings:

  - You are about to drop the column `toAddress` on the `Transaction` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_recipientAccountId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "toAddress",
ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "recipientAccountId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recipientAccountId_fkey" FOREIGN KEY ("recipientAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

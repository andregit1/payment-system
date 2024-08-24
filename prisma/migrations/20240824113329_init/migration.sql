/*
  Warnings:

  - Added the required column `transactionType` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentAccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT');

-- AlterTable
ALTER TABLE "PaymentAccount" ADD COLUMN     "availableAmount" DECIMAL(65,30),
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" "PaymentAccountStatus" NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "transactionType" "TransactionType" NOT NULL;

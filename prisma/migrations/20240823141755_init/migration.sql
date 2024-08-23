/*
  Warnings:

  - Changed the type of `accountType` on the `PaymentAccount` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PaymentAccountType" AS ENUM ('DEBIT', 'CREDIT', 'LOAN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "PaymentAccount" DROP COLUMN "accountType",
ADD COLUMN     "accountType" "PaymentAccountType" NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL;

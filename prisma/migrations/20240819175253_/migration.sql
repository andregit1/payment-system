/*
  Warnings:

  - Added the required column `currency` to the `PaymentAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentAccount" ADD COLUMN     "currency" TEXT NOT NULL;

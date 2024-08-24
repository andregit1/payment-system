/*
  Warnings:

  - You are about to drop the column `interval` on the `RecurringPayment` table. All the data in the column will be lost.
  - Added the required column `intervalUnit` to the `RecurringPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intervalValue` to the `RecurringPayment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `RecurringPayment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "RecurringPaymentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED', 'COMPLETED', 'CANCELED');

-- AlterTable
ALTER TABLE "RecurringPayment" DROP COLUMN "interval",
ADD COLUMN     "intervalUnit" "DurationUnit" NOT NULL,
ADD COLUMN     "intervalValue" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "RecurringPaymentStatus" NOT NULL;

/*
  Warnings:

  - You are about to drop the column `averagePriceTransferBuy` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "averagePriceTransferBuy",
ADD COLUMN     "averagePriceTransfer" DOUBLE PRECISION;

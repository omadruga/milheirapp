/*
  Warnings:

  - Added the required column `updatedAt` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'MEMBERSHIP', 'PARTNER', 'TRANSFER', 'TRANSFER_BUY', 'FLIGHT', 'EXPIRE');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "type" "TransactionType" NOT NULL,
    "accountId" INTEGER NOT NULL,
    "accountToId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "miles" DOUBLE PRECISION NOT NULL,
    "milesTo" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "expire" TIMESTAMP(3),
    "description" TEXT,
    "averagePrice" DOUBLE PRECISION,
    "cpfs" INTEGER,
    "milesBuy" DOUBLE PRECISION,
    "averagePriceTransferBuy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountToId_fkey" FOREIGN KEY ("accountToId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

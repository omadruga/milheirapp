-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'SALE';

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'SALE';

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PAID', 'PENDING', 'CANCELLED');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "saleProgramId" INTEGER,
ADD COLUMN     "received" DOUBLE PRECISION,
ADD COLUMN     "previsto" DOUBLE PRECISION,
ADD COLUMN     "costBasis" DOUBLE PRECISION,
ADD COLUMN     "saleStatus" "SaleStatus";

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_saleProgramId_fkey" FOREIGN KEY ("saleProgramId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

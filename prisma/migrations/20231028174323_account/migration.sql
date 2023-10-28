-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PROGRAM', 'AIRLINE');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "cpfId" INTEGER NOT NULL,
    "miles" DOUBLE PRECISION,
    "averageMilePrice" DOUBLE PRECISION,
    "neareastExpirationDate" TIMESTAMP(3),
    "seats" INTEGER,
    "seatsUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "type" "AccountType" NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_companyId_cpfId_key" ON "Account"("companyId", "cpfId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_cpfId_fkey" FOREIGN KEY ("cpfId") REFERENCES "Cpf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

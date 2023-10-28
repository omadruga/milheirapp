-- CreateTable
CREATE TABLE "cpf" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "cpf_cpf_key" ON "cpf"("cpf");

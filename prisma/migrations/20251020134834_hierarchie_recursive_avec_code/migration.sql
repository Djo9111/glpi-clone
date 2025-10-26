/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Departement` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Departement" ADD COLUMN     "code" INTEGER;

-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "porteeCode" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "superieurId" INTEGER;

-- DropEnum
DROP TYPE "public"."Hierarchie";

-- CreateIndex
CREATE UNIQUE INDEX "Departement_code_key" ON "Departement"("code");

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");

-- CreateIndex
CREATE INDEX "Ticket_departementId_idx" ON "Ticket"("departementId");

-- CreateIndex
CREATE INDEX "Utilisateur_departementId_idx" ON "Utilisateur"("departementId");

-- CreateIndex
CREATE INDEX "Utilisateur_superieurId_idx" ON "Utilisateur"("superieurId");

-- CreateIndex
CREATE INDEX "Utilisateur_porteeCode_idx" ON "Utilisateur"("porteeCode");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_superieurId_fkey" FOREIGN KEY ("superieurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

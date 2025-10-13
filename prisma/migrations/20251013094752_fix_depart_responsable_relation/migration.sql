-- CreateEnum
CREATE TYPE "Hierarchie" AS ENUM ('EMPLOYE', 'RESPONSABLE_SERVICE', 'CHEF_SERVICE', 'DGA', 'DG');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Statut" ADD VALUE 'A_CLOTURER';
ALTER TYPE "Statut" ADD VALUE 'REJETE';
ALTER TYPE "Statut" ADD VALUE 'TRANSFERE_MANTICE';

-- AlterTable
ALTER TABLE "Departement" ADD COLUMN     "responsableId" INTEGER;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "applicationId" INTEGER,
ADD COLUMN     "clotureAt" TIMESTAMP(3),
ADD COLUMN     "dureeTraitementMinutes" INTEGER,
ADD COLUMN     "manticeAt" TIMESTAMP(3),
ADD COLUMN     "manticeNumero" TEXT,
ADD COLUMN     "materielId" INTEGER,
ADD COLUMN     "prisEnChargeAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materiel" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Materiel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_nom_key" ON "Application"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Materiel_nom_key" ON "Materiel"("nom");

-- AddForeignKey
ALTER TABLE "Departement" ADD CONSTRAINT "Departement_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_materielId_fkey" FOREIGN KEY ("materielId") REFERENCES "Materiel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

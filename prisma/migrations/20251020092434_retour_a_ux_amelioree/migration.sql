/*
  Warnings:

  - You are about to drop the column `parentId` on the `Departement` table. All the data in the column will be lost.
  - You are about to drop the column `actif` on the `Utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `hierarchie` on the `Utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `superieurId` on the `Utilisateur` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Commentaire" DROP CONSTRAINT "Commentaire_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Departement" DROP CONSTRAINT "Departement_parentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PieceJointe" DROP CONSTRAINT "PieceJointe_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Utilisateur" DROP CONSTRAINT "Utilisateur_superieurId_fkey";

-- DropIndex
DROP INDEX "public"."Departement_parentId_idx";

-- DropIndex
DROP INDEX "public"."Notification_userId_isRead_idx";

-- DropIndex
DROP INDEX "public"."PieceJointe_ticketId_idx";

-- DropIndex
DROP INDEX "public"."Ticket_assignedToId_idx";

-- DropIndex
DROP INDEX "public"."Ticket_createdById_idx";

-- DropIndex
DROP INDEX "public"."Ticket_dateCreation_idx";

-- DropIndex
DROP INDEX "public"."Ticket_departementId_idx";

-- DropIndex
DROP INDEX "public"."Ticket_statut_idx";

-- DropIndex
DROP INDEX "public"."Ticket_type_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_departementId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_email_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_hierarchie_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_role_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_superieurId_idx";

-- AlterTable
ALTER TABLE "Departement" DROP COLUMN "parentId";

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "actif",
DROP COLUMN "hierarchie",
DROP COLUMN "superieurId";

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

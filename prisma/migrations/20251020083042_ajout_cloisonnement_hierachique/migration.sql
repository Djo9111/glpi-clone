/*
  Warnings:

  - You are about to drop the column `managerId` on the `Utilisateur` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Commentaire" DROP CONSTRAINT "Commentaire_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PieceJointe" DROP CONSTRAINT "PieceJointe_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Utilisateur" DROP CONSTRAINT "Utilisateur_managerId_fkey";

-- DropIndex
DROP INDEX "public"."Departement_responsableId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_managerId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_role_hierarchie_idx";

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "managerId",
ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "superieurId" INTEGER;

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "PieceJointe_ticketId_idx" ON "PieceJointe"("ticketId");

-- CreateIndex
CREATE INDEX "Ticket_statut_idx" ON "Ticket"("statut");

-- CreateIndex
CREATE INDEX "Ticket_type_idx" ON "Ticket"("type");

-- CreateIndex
CREATE INDEX "Ticket_dateCreation_idx" ON "Ticket"("dateCreation");

-- CreateIndex
CREATE INDEX "Utilisateur_superieurId_idx" ON "Utilisateur"("superieurId");

-- CreateIndex
CREATE INDEX "Utilisateur_role_idx" ON "Utilisateur"("role");

-- CreateIndex
CREATE INDEX "Utilisateur_hierarchie_idx" ON "Utilisateur"("hierarchie");

-- CreateIndex
CREATE INDEX "Utilisateur_email_idx" ON "Utilisateur"("email");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_superieurId_fkey" FOREIGN KEY ("superieurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceJointe" ADD CONSTRAINT "PieceJointe_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

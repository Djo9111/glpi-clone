/*
  Warnings:

  - You are about to drop the column `chefId` on the `Utilisateur` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Utilisateur" DROP CONSTRAINT "Utilisateur_chefId_fkey";

-- DropIndex
DROP INDEX "public"."Notification_userId_isRead_idx";

-- DropIndex
DROP INDEX "public"."PieceJointe_ticketId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_chefId_idx";

-- AlterTable
ALTER TABLE "Departement" ADD COLUMN     "parentId" INTEGER;

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "chefId",
ADD COLUMN     "managerId" INTEGER;

-- CreateIndex
CREATE INDEX "Departement_parentId_idx" ON "Departement"("parentId");

-- CreateIndex
CREATE INDEX "Utilisateur_managerId_idx" ON "Utilisateur"("managerId");

-- CreateIndex
CREATE INDEX "Utilisateur_role_hierarchie_idx" ON "Utilisateur"("role", "hierarchie");

-- AddForeignKey
ALTER TABLE "Departement" ADD CONSTRAINT "Departement_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Departement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

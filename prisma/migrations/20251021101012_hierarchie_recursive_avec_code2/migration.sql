-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "managerId" INTEGER,
ADD COLUMN     "roleCode" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "public"."Hierarchie";

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_ticketId_idx" ON "Notification"("ticketId");

-- CreateIndex
CREATE INDEX "PieceJointe_ticketId_idx" ON "PieceJointe"("ticketId");

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");

-- CreateIndex
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");

-- CreateIndex
CREATE INDEX "Ticket_departementId_idx" ON "Ticket"("departementId");

-- CreateIndex
CREATE INDEX "Utilisateur_departementId_idx" ON "Utilisateur"("departementId");

-- CreateIndex
CREATE INDEX "Utilisateur_managerId_idx" ON "Utilisateur"("managerId");

-- CreateIndex
CREATE INDEX "Utilisateur_roleCode_idx" ON "Utilisateur"("roleCode");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

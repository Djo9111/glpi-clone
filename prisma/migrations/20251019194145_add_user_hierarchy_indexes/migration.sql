-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "chefId" INTEGER,
ADD COLUMN     "hierarchie" "Hierarchie" NOT NULL DEFAULT 'EMPLOYE';

-- CreateIndex
CREATE INDEX "Departement_responsableId_idx" ON "Departement"("responsableId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "PieceJointe_ticketId_idx" ON "PieceJointe"("ticketId");

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");

-- CreateIndex
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");

-- CreateIndex
CREATE INDEX "Ticket_departementId_idx" ON "Ticket"("departementId");

-- CreateIndex
CREATE INDEX "Utilisateur_chefId_idx" ON "Utilisateur"("chefId");

-- CreateIndex
CREATE INDEX "Utilisateur_departementId_idx" ON "Utilisateur"("departementId");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

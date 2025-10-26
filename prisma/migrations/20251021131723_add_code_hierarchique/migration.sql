-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "codeHierarchique" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "public"."Hierarchie";

-- CreateIndex
CREATE INDEX "Utilisateur_departementId_codeHierarchique_idx" ON "Utilisateur"("departementId", "codeHierarchique");

/*
  Warnings:

  - The values [TRANSFERE_mantis] on the enum `Statut` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `mantisAt` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `mantisNumero` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Statut_new" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'A_CLOTURER', 'REJETE', 'TRANSFERE_MANTIS');
ALTER TABLE "public"."Ticket" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "statut" TYPE "Statut_new" USING ("statut"::text::"Statut_new");
ALTER TYPE "Statut" RENAME TO "Statut_old";
ALTER TYPE "Statut_new" RENAME TO "Statut";
DROP TYPE "public"."Statut_old";
ALTER TABLE "Ticket" ALTER COLUMN "statut" SET DEFAULT 'OPEN';
COMMIT;

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "mantisAt",
DROP COLUMN "mantisNumero",
ADD COLUMN     "mantisAt" TIMESTAMP(3),
ADD COLUMN     "mantisumero" TEXT,
ALTER COLUMN "statut" DROP NOT NULL;

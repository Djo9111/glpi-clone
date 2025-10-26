/*
  Warnings:

  - You are about to drop the column `code` on the `Departement` table. All the data in the column will be lost.
  - You are about to drop the column `porteeCode` on the `Utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `superieurId` on the `Utilisateur` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Hierarchie" AS ENUM ('EMPLOYE', 'RESPONSABLE_SERVICE', 'CHEF_SERVICE', 'DGA', 'DG');

-- DropForeignKey
ALTER TABLE "public"."Utilisateur" DROP CONSTRAINT "Utilisateur_superieurId_fkey";

-- DropIndex
DROP INDEX "public"."Departement_code_key";

-- DropIndex
DROP INDEX "public"."Ticket_createdById_idx";

-- DropIndex
DROP INDEX "public"."Ticket_departementId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_departementId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_porteeCode_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_superieurId_idx";

-- AlterTable
ALTER TABLE "Departement" DROP COLUMN "code";

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "porteeCode",
DROP COLUMN "superieurId";

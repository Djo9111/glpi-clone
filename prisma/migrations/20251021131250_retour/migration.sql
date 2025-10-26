/*
  Warnings:

  - You are about to drop the column `managerId` on the `Utilisateur` table. All the data in the column will be lost.
  - You are about to drop the column `roleCode` on the `Utilisateur` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Hierarchie" AS ENUM ('EMPLOYE', 'RESPONSABLE_SERVICE', 'CHEF_SERVICE', 'DGA', 'DG');

-- DropForeignKey
ALTER TABLE "public"."Utilisateur" DROP CONSTRAINT "Utilisateur_managerId_fkey";

-- DropIndex
DROP INDEX "public"."Notification_ticketId_idx";

-- DropIndex
DROP INDEX "public"."Notification_userId_idx";

-- DropIndex
DROP INDEX "public"."PieceJointe_ticketId_idx";

-- DropIndex
DROP INDEX "public"."Ticket_assignedToId_idx";

-- DropIndex
DROP INDEX "public"."Ticket_createdById_idx";

-- DropIndex
DROP INDEX "public"."Ticket_departementId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_departementId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_managerId_idx";

-- DropIndex
DROP INDEX "public"."Utilisateur_roleCode_idx";

-- AlterTable
ALTER TABLE "Utilisateur" DROP COLUMN "managerId",
DROP COLUMN "roleCode";

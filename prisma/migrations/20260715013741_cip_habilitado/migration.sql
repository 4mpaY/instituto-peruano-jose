/*
  Warnings:

  - You are about to drop the column `certificado_cid_habilitado` on the `inscripciones` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inscripciones" DROP COLUMN "certificado_cid_habilitado",
ADD COLUMN     "certificado_cip_habilitado" BOOLEAN NOT NULL DEFAULT false;

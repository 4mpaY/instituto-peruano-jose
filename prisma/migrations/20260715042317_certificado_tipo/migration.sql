-- CreateEnum
CREATE TYPE "CertificadoTipo" AS ENUM ('IPG', 'CIP');

-- AlterTable
ALTER TABLE "certificados" ADD COLUMN     "tipo" "CertificadoTipo" NOT NULL DEFAULT 'IPG';

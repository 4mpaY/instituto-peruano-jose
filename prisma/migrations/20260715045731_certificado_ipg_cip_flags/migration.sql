-- AlterTable: add per-tipo entitlement flags
ALTER TABLE "certificados" ADD COLUMN     "ipg_habilitado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "certificados" ADD COLUMN     "cip_habilitado" BOOLEAN NOT NULL DEFAULT false;

-- Backfill from the previous single "tipo" column
UPDATE "certificados" SET "ipg_habilitado" = true WHERE "tipo" = 'IPG';
UPDATE "certificados" SET "cip_habilitado" = true WHERE "tipo" = 'CIP';

-- Drop the old single-tipo column and its enum
ALTER TABLE "certificados" DROP COLUMN "tipo";
DROP TYPE "CertificadoTipo";

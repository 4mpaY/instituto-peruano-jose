-- AlterTable
ALTER TABLE "inscripciones" ADD COLUMN "certificado_ipg_habilitado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "inscripciones" ADD COLUMN "certificado_cid_habilitado" BOOLEAN NOT NULL DEFAULT false;

-- Migrar habilitaciones existentes al certificado IPG
UPDATE "inscripciones"
SET "certificado_ipg_habilitado" = "certificado_habilitado"
WHERE "certificado_habilitado" = true;

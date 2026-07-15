-- Safety-net backfill: fills tipo from the legacy flags for any row that
-- wasn't backfilled yet by the (now removed) prisma/scripts/backfill-certificado-tipo.ts
-- one-off script. No-op if every row already has tipo set. Rows that had both
-- flags enabled default to IPG (their CIP entitlement lives independently on
-- Inscripcion.certificado_cip_habilitado and is unaffected by this default).
UPDATE "certificados" SET "tipo" = 'CIP' WHERE "tipo" IS NULL AND "cip_habilitado" = true AND "ipg_habilitado" = false;
UPDATE "certificados" SET "tipo" = 'IPG' WHERE "tipo" IS NULL;

-- Make tipo required
ALTER TABLE "certificados" ALTER COLUMN "tipo" SET NOT NULL;

-- Drop columns superseded by tipo, and the dead numero_intento column
ALTER TABLE "certificados" DROP COLUMN "ipg_habilitado";
ALTER TABLE "certificados" DROP COLUMN "cip_habilitado";
ALTER TABLE "certificados" DROP COLUMN "numero_intento";

-- New compound unique: one row per (usuario, curso, tipo)
CREATE UNIQUE INDEX "certificados_usuario_id_curso_id_tipo_key" ON "certificados"("usuario_id", "curso_id", "tipo");

-- Make tipo required (backfill already completed, 0 nulls remain)
ALTER TABLE "certificados" ALTER COLUMN "tipo" SET NOT NULL;

-- Drop columns superseded by tipo, and the dead numero_intento column
ALTER TABLE "certificados" DROP COLUMN "ipg_habilitado";
ALTER TABLE "certificados" DROP COLUMN "cip_habilitado";
ALTER TABLE "certificados" DROP COLUMN "numero_intento";

-- New compound unique: one row per (usuario, curso, tipo)
CREATE UNIQUE INDEX "certificados_usuario_id_curso_id_tipo_key" ON "certificados"("usuario_id", "curso_id", "tipo");

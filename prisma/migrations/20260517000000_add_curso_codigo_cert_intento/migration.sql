-- AlterTable: codigo de curso para formato de certificado
ALTER TABLE "cursos" ADD COLUMN IF NOT EXISTS "codigo" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "cursos_codigo_key" ON "cursos"("codigo");

-- AlterTable: numero de intento en certificados
ALTER TABLE "certificados" ADD COLUMN IF NOT EXISTS "numero_intento" INTEGER NOT NULL DEFAULT 1;

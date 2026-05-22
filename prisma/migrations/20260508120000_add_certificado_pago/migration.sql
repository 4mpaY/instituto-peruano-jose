-- AlterTable: precio del certificado en cursos
ALTER TABLE "cursos" ADD COLUMN IF NOT EXISTS "precio_certificado" DECIMAL(10,2);

-- AlterTable: flag de habilitación en inscripciones
ALTER TABLE "inscripciones" ADD COLUMN IF NOT EXISTS "certificado_habilitado" BOOLEAN NOT NULL DEFAULT false;

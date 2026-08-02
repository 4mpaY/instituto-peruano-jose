-- Curso: configuración de entrega de certificados IPG / CIP
ALTER TABLE "cursos" ADD COLUMN IF NOT EXISTS "certificado_ipg_espera_valor" INTEGER DEFAULT 0;
ALTER TABLE "cursos" ADD COLUMN IF NOT EXISTS "certificado_ipg_espera_unidad" TEXT DEFAULT 'DIAS';
ALTER TABLE "cursos" ADD COLUMN IF NOT EXISTS "certificado_cip_entregas" JSONB DEFAULT '[]';

-- Inscripcion: marca temporal de habilitación (inicio del tiempo de espera)
ALTER TABLE "inscripciones" ADD COLUMN IF NOT EXISTS "certificado_ipg_habilitado_en" TIMESTAMP(3);
ALTER TABLE "inscripciones" ADD COLUMN IF NOT EXISTS "certificado_cip_habilitado_en" TIMESTAMP(3);

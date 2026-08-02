-- Pedidos de certificado (tramitación IPG/CIP)
DO $$ BEGIN
  CREATE TYPE "TipoPedido" AS ENUM ('CURSO', 'CERTIFICADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "tipo" "TipoPedido" NOT NULL DEFAULT 'CURSO';
CREATE INDEX IF NOT EXISTS "pedidos_tipo_idx" ON "pedidos"("tipo");

ALTER TABLE "detalles_pedido" ADD COLUMN IF NOT EXISTS "certificado_tipo" "CertificadoTipo";

ALTER TABLE "cursos" ADD COLUMN IF NOT EXISTS "precio_certificado_ipg" DECIMAL(10,2);
ALTER TABLE "cursos" ADD COLUMN IF NOT EXISTS "precio_certificado_cip" DECIMAL(10,2);

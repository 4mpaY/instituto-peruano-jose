-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "detalle_envio_fisico" TEXT,
ADD COLUMN     "precio_envio_fisico" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "datos_envio" JSONB,
ADD COLUMN     "solicita_envio" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "EstadoComentario" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- AlterTable
ALTER TABLE "comentarios" ADD COLUMN     "estado" "EstadoComentario" NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "cursos" ALTER COLUMN "nivel" DROP NOT NULL,
ALTER COLUMN "nivel" DROP DEFAULT;

-- AlterTable
ALTER TABLE "lecciones" ADD COLUMN     "fecha_fin" TIMESTAMP(3);

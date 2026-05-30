-- CreateEnum
CREATE TYPE "TipoCurso" AS ENUM ('CURSO', 'DIPLOMADO');

-- AlterTable
ALTER TABLE "cursos" ADD COLUMN "tipo" "TipoCurso" NOT NULL DEFAULT 'CURSO';

-- CreateIndex
CREATE INDEX "cursos_tipo_idx" ON "cursos"("tipo");

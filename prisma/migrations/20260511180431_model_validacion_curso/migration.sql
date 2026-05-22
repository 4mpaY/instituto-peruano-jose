-- AlterEnum
ALTER TYPE "MetodoPago" ADD VALUE 'MERCADOPAGO';

-- CreateTable
CREATE TABLE "valoraciones_curso" (
    "id" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,

    CONSTRAINT "valoraciones_curso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "valoraciones_curso_usuario_id_idx" ON "valoraciones_curso"("usuario_id");

-- CreateIndex
CREATE INDEX "valoraciones_curso_curso_id_idx" ON "valoraciones_curso"("curso_id");

-- CreateIndex
CREATE UNIQUE INDEX "valoraciones_curso_usuario_id_curso_id_key" ON "valoraciones_curso"("usuario_id", "curso_id");

-- AddForeignKey
ALTER TABLE "valoraciones_curso" ADD CONSTRAINT "valoraciones_curso_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valoraciones_curso" ADD CONSTRAINT "valoraciones_curso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

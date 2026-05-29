-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "vigencia_meses" INTEGER;

-- AlterTable
ALTER TABLE "inscripciones" ADD COLUMN     "acceso_hasta" TIMESTAMP(3);

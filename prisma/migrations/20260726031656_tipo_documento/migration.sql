-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'CE', 'PASAPORTE', 'OTRO');

-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'ASESOR';

-- AlterEnum
ALTER TYPE "TipoCurso" ADD VALUE 'ESPECIALIZACION';

-- AlterTable
ALTER TABLE "certificados" ALTER COLUMN "tipo" SET DEFAULT 'IPG';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "tipo_documento" "TipoDocumento" DEFAULT 'DNI';

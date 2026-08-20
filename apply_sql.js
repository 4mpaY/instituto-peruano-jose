const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sqls = [
    `DO $$ BEGIN CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'CE', 'PASAPORTE', 'OTRO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN ALTER TYPE "Rol" ADD VALUE 'ASESOR'; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `ALTER TABLE "certificados" ALTER COLUMN "tipo" SET DEFAULT 'IPG';`,
    `ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "tipo_documento" "TipoDocumento" DEFAULT 'DNI';`
  ];

  for (const sql of sqls) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('Executed:', sql);
    } catch(e) {
      console.error('Failed:', sql, e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());

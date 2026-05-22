/*
  Warnings:

  - Made the column `precio_falso` on table `cursos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "cursos" ALTER COLUMN "precio_falso" SET NOT NULL,
ALTER COLUMN "precio_falso" SET DEFAULT 0;

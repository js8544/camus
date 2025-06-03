/*
  Warnings:

  - A unique constraint covering the columns `[shareSlug]` on the table `artifacts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "artifacts" ADD COLUMN     "shareSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "artifacts_shareSlug_key" ON "artifacts"("shareSlug");

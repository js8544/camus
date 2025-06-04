/*
  Warnings:

  - A unique constraint covering the columns `[shareSlug]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareSlug" TEXT,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "conversations_shareSlug_key" ON "conversations"("shareSlug");

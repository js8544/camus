/*
  Warnings:

  - You are about to drop the column `title` on the `artifacts` table. All the data in the column will be lost.
  - You are about to alter the column `timestamp` on the `artifacts` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to drop the column `artifactViewMode` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `currentDisplayResultId` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `expandedThinking` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `tool_calls` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "artifacts" DROP COLUMN "title",
ALTER COLUMN "type" SET DEFAULT 'HTML',
ALTER COLUMN "timestamp" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "artifactViewMode",
DROP COLUMN "currentDisplayResultId",
DROP COLUMN "expandedThinking";

-- AlterTable
ALTER TABLE "tool_calls" DROP COLUMN "displayName";

-- CreateTable
CREATE TABLE "tool_results" (
    "id" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "displayName" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_results_pkey" PRIMARY KEY ("id")
);

/*
  Warnings:

  - Added the required column `name` to the `artifacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `artifacts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageRole" ADD VALUE 'THINKING';
ALTER TYPE "MessageRole" ADD VALUE 'TOOL';
ALTER TYPE "MessageRole" ADD VALUE 'TOOL_RESULT';

-- AlterTable
ALTER TABLE "artifacts" ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "timestamp" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "artifactViewMode" TEXT NOT NULL DEFAULT 'view',
ADD COLUMN     "currentDisplayResultId" TEXT,
ADD COLUMN     "expandedThinking" JSONB;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "artifactId" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isError" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thinkingContent" TEXT,
ADD COLUMN     "toolCallId" TEXT,
ADD COLUMN     "toolName" TEXT,
ADD COLUMN     "toolResultId" TEXT;

-- AlterTable
ALTER TABLE "tool_calls" ADD COLUMN     "displayName" TEXT;

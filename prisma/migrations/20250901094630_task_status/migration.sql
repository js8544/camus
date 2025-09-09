-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'STAGE', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'PENDING';

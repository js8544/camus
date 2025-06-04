-- AlterTable
ALTER TABLE "users" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "lastCreditReset" TIMESTAMP(3);

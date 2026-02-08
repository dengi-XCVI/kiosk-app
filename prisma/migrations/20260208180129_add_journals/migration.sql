-- CreateEnum
CREATE TYPE "JournalRole" AS ENUM ('ADMIN', 'WRITER');

-- AlterTable
ALTER TABLE "article" ADD COLUMN     "journalId" TEXT;

-- CreateTable
CREATE TABLE "journal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "role" "JournalRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "journal_slug_key" ON "journal"("slug");

-- CreateIndex
CREATE INDEX "journal_member_journalId_idx" ON "journal_member"("journalId");

-- CreateIndex
CREATE UNIQUE INDEX "journal_member_userId_journalId_key" ON "journal_member"("userId", "journalId");

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_member" ADD CONSTRAINT "journal_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_member" ADD CONSTRAINT "journal_member_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

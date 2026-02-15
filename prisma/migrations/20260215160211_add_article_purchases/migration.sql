-- CreateTable
CREATE TABLE "article_purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_purchase_articleId_idx" ON "article_purchase"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "article_purchase_userId_articleId_key" ON "article_purchase"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "article_purchase" ADD CONSTRAINT "article_purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_purchase" ADD CONSTRAINT "article_purchase_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

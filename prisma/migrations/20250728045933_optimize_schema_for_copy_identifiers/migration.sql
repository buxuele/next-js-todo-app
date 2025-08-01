/*
  Warnings:

  - You are about to alter the column `alias` on the `DateAlias` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE "DateAlias" ALTER COLUMN "alias" SET DATA TYPE VARCHAR(200);

-- CreateIndex
CREATE INDEX "DateAlias_createdAt_idx" ON "DateAlias"("createdAt");

-- CreateIndex
CREATE INDEX "Todo_date_completed_idx" ON "Todo"("date", "completed");

-- CreateIndex
CREATE INDEX "Todo_createdAt_idx" ON "Todo"("createdAt");

-- CreateTable
CREATE TABLE "Todo" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "orderNum" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateAlias" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Todo_date_idx" ON "Todo"("date");

-- CreateIndex
CREATE INDEX "Todo_date_orderNum_idx" ON "Todo"("date", "orderNum");

-- CreateIndex
CREATE UNIQUE INDEX "DateAlias_date_key" ON "DateAlias"("date");

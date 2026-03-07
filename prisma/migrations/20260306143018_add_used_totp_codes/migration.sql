-- CreateTable
CREATE TABLE "UsedTotpCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UsedTotpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UsedTotpCode_userId_idx" ON "UsedTotpCode"("userId");

-- CreateIndex
CREATE INDEX "UsedTotpCode_usedAt_idx" ON "UsedTotpCode"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UsedTotpCode_userId_code_key" ON "UsedTotpCode"("userId", "code");

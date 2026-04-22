-- CreateTable
CREATE TABLE "CoachUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CoachUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CoachUsage_userId_idx" ON "CoachUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachUsage_userId_date_key" ON "CoachUsage"("userId", "date");

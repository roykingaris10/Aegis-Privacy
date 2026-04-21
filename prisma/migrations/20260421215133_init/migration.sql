-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATETIME,
    "skillProgress" JSONB NOT NULL,
    "badges" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "clientId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "contentPath" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ScenarioCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "timeSpentSec" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScenarioCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScenarioCompletion_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "coachFeedback" TEXT NOT NULL,
    "rubricScores" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Response_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

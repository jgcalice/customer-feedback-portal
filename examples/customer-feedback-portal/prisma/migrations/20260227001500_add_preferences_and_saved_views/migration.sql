-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "problemsProductId" TEXT,
    "problemsStatus" TEXT,
    "problemsSearch" TEXT,
    "problemsSort" TEXT NOT NULL DEFAULT 'recent',
    "problemsMineOnly" BOOLEAN NOT NULL DEFAULT false,
    "problemsPageSize" INTEGER NOT NULL DEFAULT 6,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedProblemView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "status" TEXT,
    "search" TEXT,
    "sort" TEXT NOT NULL DEFAULT 'recent',
    "mineOnly" BOOLEAN NOT NULL DEFAULT false,
    "pageSize" INTEGER NOT NULL DEFAULT 6,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SavedProblemView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SavedProblemView_userId_createdAt_idx" ON "SavedProblemView"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedProblemView_userId_isFavorite_idx" ON "SavedProblemView"("userId", "isFavorite");

CREATE TABLE "BackupLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "action" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "countsJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BackupLog_action_idx" ON "BackupLog"("action");
CREATE INDEX "BackupLog_createdAt_idx" ON "BackupLog"("createdAt");

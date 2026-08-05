-- CreateTable
CREATE TABLE "ClinicalEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hospitalizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EVOLUTION',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT,
    "eventAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" REAL,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "weight" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClinicalEvent_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClinicalEvent_hospitalizationId_idx" ON "ClinicalEvent"("hospitalizationId");

-- CreateIndex
CREATE INDEX "ClinicalEvent_type_idx" ON "ClinicalEvent"("type");

-- CreateIndex
CREATE INDEX "ClinicalEvent_eventAt_idx" ON "ClinicalEvent"("eventAt");

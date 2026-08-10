ALTER TABLE "ClinicalAttachment" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'OTHER';

CREATE TABLE "FinancialEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PAID',
  "paymentMethod" TEXT,
  "occurredAt" DATETIME NOT NULL,
  "dueAt" DATETIME,
  "paidAt" DATETIME,
  "animalId" TEXT,
  "hospitalizationId" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "FinancialEntry_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "FinancialEntry_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "FinancialEntry_type_idx" ON "FinancialEntry"("type");
CREATE INDEX "FinancialEntry_status_idx" ON "FinancialEntry"("status");
CREATE INDEX "FinancialEntry_category_idx" ON "FinancialEntry"("category");
CREATE INDEX "FinancialEntry_occurredAt_idx" ON "FinancialEntry"("occurredAt");
CREATE INDEX "FinancialEntry_animalId_idx" ON "FinancialEntry"("animalId");
CREATE INDEX "FinancialEntry_hospitalizationId_idx" ON "FinancialEntry"("hospitalizationId");

CREATE TABLE "PreventiveRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "animalId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "manufacturer" TEXT,
  "batch" TEXT,
  "appliedAt" DATETIME NOT NULL,
  "nextDueAt" DATETIME,
  "professionalId" TEXT,
  "responsible" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PreventiveRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PreventiveRecord_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "PreventiveRecord_animalId_idx" ON "PreventiveRecord"("animalId");
CREATE INDEX "PreventiveRecord_type_idx" ON "PreventiveRecord"("type");
CREATE INDEX "PreventiveRecord_nextDueAt_idx" ON "PreventiveRecord"("nextDueAt");
CREATE INDEX "PreventiveRecord_professionalId_idx" ON "PreventiveRecord"("professionalId");

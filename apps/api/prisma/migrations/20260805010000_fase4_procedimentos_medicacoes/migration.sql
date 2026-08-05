-- Fase 4: procedimentos, prescrições e doses
ALTER TABLE "Procedure" ADD COLUMN "description" TEXT;
ALTER TABLE "Procedure" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Procedure" ADD COLUMN "responsible" TEXT;
ALTER TABLE "Procedure" ADD COLUMN "notes" TEXT;
ALTER TABLE "Procedure" ADD COLUMN "updatedAt" DATETIME;
UPDATE "Procedure" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

CREATE TABLE "MedicationPrescription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "hospitalizationId" TEXT NOT NULL,
  "medication" TEXT NOT NULL,
  "dose" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "frequencyHours" INTEGER NOT NULL,
  "startAt" DATETIME NOT NULL,
  "endAt" DATETIME,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "MedicationPrescription_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE "MedicationDose" ADD COLUMN "prescriptionId" TEXT REFERENCES "MedicationPrescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MedicationDose" ADD COLUMN "dose" TEXT;
ALTER TABLE "MedicationDose" ADD COLUMN "unit" TEXT;
ALTER TABLE "MedicationDose" ADD COLUMN "route" TEXT;
ALTER TABLE "MedicationDose" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "MedicationDose" ADD COLUMN "administeredBy" TEXT;
ALTER TABLE "MedicationDose" ADD COLUMN "notes" TEXT;
ALTER TABLE "MedicationDose" ADD COLUMN "updatedAt" DATETIME;
UPDATE "MedicationDose" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

CREATE INDEX "Procedure_hospitalizationId_idx" ON "Procedure"("hospitalizationId");
CREATE INDEX "Procedure_status_idx" ON "Procedure"("status");
CREATE INDEX "Procedure_scheduledAt_idx" ON "Procedure"("scheduledAt");
CREATE INDEX "MedicationPrescription_hospitalizationId_idx" ON "MedicationPrescription"("hospitalizationId");
CREATE INDEX "MedicationPrescription_active_idx" ON "MedicationPrescription"("active");
CREATE INDEX "MedicationDose_prescriptionId_idx" ON "MedicationDose"("prescriptionId");
CREATE INDEX "MedicationDose_status_idx" ON "MedicationDose"("status");
CREATE INDEX "MedicationDose_scheduledAt_idx" ON "MedicationDose"("scheduledAt");

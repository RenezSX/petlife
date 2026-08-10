ALTER TABLE "MedicationPrescription" ADD COLUMN "inventoryItemId" TEXT;
ALTER TABLE "MedicationPrescription" ADD COLUMN "inventoryQuantity" REAL;
ALTER TABLE "MedicationDose" ADD COLUMN "inventoryItemId" TEXT;
ALTER TABLE "MedicationDose" ADD COLUMN "inventoryQuantity" REAL;

CREATE INDEX "MedicationPrescription_inventoryItemId_idx" ON "MedicationPrescription"("inventoryItemId");
CREATE INDEX "MedicationDose_inventoryItemId_idx" ON "MedicationDose"("inventoryItemId");

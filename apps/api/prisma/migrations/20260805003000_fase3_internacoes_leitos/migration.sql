-- AlterTable
ALTER TABLE "Bed" ADD COLUMN "notes" TEXT;

-- AlterTable
ALTER TABLE "Hospitalization" ADD COLUMN "veterinarian" TEXT;
ALTER TABLE "Hospitalization" ADD COLUMN "notes" TEXT;
ALTER TABLE "Hospitalization" ADD COLUMN "expectedDischargeAt" DATETIME;
ALTER TABLE "Hospitalization" ADD COLUMN "dischargeSummary" TEXT;

-- CreateIndex
CREATE INDEX "Bed_sector_idx" ON "Bed"("sector");
CREATE INDEX "Bed_active_idx" ON "Bed"("active");
CREATE INDEX "Hospitalization_priority_idx" ON "Hospitalization"("priority");
CREATE INDEX "Hospitalization_animalId_idx" ON "Hospitalization"("animalId");
CREATE INDEX "Hospitalization_bedId_idx" ON "Hospitalization"("bedId");

-- Integra profissionais aos fluxos clinicos sem quebrar registros antigos.
ALTER TABLE "MedicationPrescription" ADD COLUMN "responsible" TEXT;
ALTER TABLE "MedicationPrescription" ADD COLUMN "professionalId" TEXT;
ALTER TABLE "MedicationDose" ADD COLUMN "administeredByProfessionalId" TEXT;
ALTER TABLE "ClinicalEvent" ADD COLUMN "professionalId" TEXT;

CREATE INDEX "MedicationPrescription_professionalId_idx" ON "MedicationPrescription"("professionalId");
CREATE INDEX "MedicationDose_administeredByProfessionalId_idx" ON "MedicationDose"("administeredByProfessionalId");
CREATE INDEX "ClinicalEvent_professionalId_idx" ON "ClinicalEvent"("professionalId");

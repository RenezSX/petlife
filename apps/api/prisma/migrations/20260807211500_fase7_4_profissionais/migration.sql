-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "crmv" TEXT,
    "specialty" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- AlterTable
ALTER TABLE "Hospitalization" ADD COLUMN "professionalId" TEXT;
ALTER TABLE "Procedure" ADD COLUMN "professionalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Professional_crmv_key" ON "Professional"("crmv");
CREATE INDEX "Professional_name_idx" ON "Professional"("name");
CREATE INDEX "Professional_role_idx" ON "Professional"("role");
CREATE INDEX "Professional_active_idx" ON "Professional"("active");
CREATE INDEX "Hospitalization_professionalId_idx" ON "Hospitalization"("professionalId");
CREATE INDEX "Procedure_professionalId_idx" ON "Procedure"("professionalId");

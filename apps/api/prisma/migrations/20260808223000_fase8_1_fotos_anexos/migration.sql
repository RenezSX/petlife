-- CreateTable
CREATE TABLE "ClinicalAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "animalId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "professionalId" TEXT,
    "professionalName" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClinicalAttachment_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClinicalAttachment_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClinicalAttachment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ClinicalAttachment_animalId_idx" ON "ClinicalAttachment"("animalId");
CREATE INDEX "ClinicalAttachment_hospitalizationId_idx" ON "ClinicalAttachment"("hospitalizationId");
CREATE INDEX "ClinicalAttachment_professionalId_idx" ON "ClinicalAttachment"("professionalId");
CREATE INDEX "ClinicalAttachment_createdAt_idx" ON "ClinicalAttachment"("createdAt");

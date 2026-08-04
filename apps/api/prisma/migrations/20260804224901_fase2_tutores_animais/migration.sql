-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Animal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "sex" TEXT,
    "birthDate" DATETIME,
    "approximateAge" TEXT,
    "weight" REAL,
    "color" TEXT,
    "microchip" TEXT,
    "neutered" BOOLEAN NOT NULL DEFAULT false,
    "allergies" TEXT,
    "previousDiseases" TEXT,
    "continuousMedications" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tutorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Animal_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Animal" ("birthDate", "breed", "createdAt", "id", "name", "species", "tutorId", "updatedAt", "weight") SELECT "birthDate", "breed", "createdAt", "id", "name", "species", "tutorId", "updatedAt", "weight" FROM "Animal";
DROP TABLE "Animal";
ALTER TABLE "new_Animal" RENAME TO "Animal";
CREATE UNIQUE INDEX "Animal_microchip_key" ON "Animal"("microchip");
CREATE INDEX "Animal_name_idx" ON "Animal"("name");
CREATE INDEX "Animal_species_idx" ON "Animal"("species");
CREATE INDEX "Animal_tutorId_idx" ON "Animal"("tutorId");
CREATE INDEX "Animal_active_idx" ON "Animal"("active");
CREATE TABLE "new_Tutor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tutor" ("createdAt", "email", "id", "name", "phone", "updatedAt") SELECT "createdAt", "email", "id", "name", "phone", "updatedAt" FROM "Tutor";
DROP TABLE "Tutor";
ALTER TABLE "new_Tutor" RENAME TO "Tutor";
CREATE UNIQUE INDEX "Tutor_cpf_key" ON "Tutor"("cpf");
CREATE INDEX "Tutor_name_idx" ON "Tutor"("name");
CREATE INDEX "Tutor_active_idx" ON "Tutor"("active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

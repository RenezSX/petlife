CREATE TABLE "ClinicSettings" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'clinic',
  "name" TEXT NOT NULL DEFAULT 'PetLife São Caetano',
  "legalName" TEXT,
  "cnpj" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "logoDataUrl" TEXT,
  "openingHours" TEXT,
  "sectorsJson" TEXT NOT NULL DEFAULT '[]',
  "prioritiesJson" TEXT NOT NULL DEFAULT '[]',
  "speciesJson" TEXT NOT NULL DEFAULT '[]',
  "medicationRoutesJson" TEXT NOT NULL DEFAULT '[]',
  "theme" TEXT NOT NULL DEFAULT 'light',
  "tagline" TEXT NOT NULL DEFAULT 'Cuidando com amor, tratando com excelência.',
  "updatedAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "ClinicSettings" (
  "id", "name", "openingHours", "sectorsJson", "prioritiesJson", "speciesJson", "medicationRoutesJson", "theme", "tagline", "updatedAt"
) VALUES (
  'clinic',
  'PetLife São Caetano',
  'Atendimento 24 horas',
  '["Internação","UTI","Observação","Isolamento"]',
  '["NORMAL","HIGH","CRITICAL"]',
  '["Cão","Gato","Ave","Coelho","Outro"]',
  '["Oral","Intravenosa","Intramuscular","Subcutânea","Tópica","Oftálmica","Inalatória"]',
  'light',
  'Cuidando com amor, tratando com excelência.',
  CURRENT_TIMESTAMP
);

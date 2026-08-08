import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.clinicSettings.upsert({
    where: { id: 'clinic' },
    update: {},
    create: {
      id: 'clinic',
      name: 'PetLife São Caetano',
      openingHours: 'Atendimento 24 horas',
      sectorsJson: JSON.stringify(['Internação', 'UTI', 'Observação', 'Isolamento']),
      prioritiesJson: JSON.stringify(['NORMAL', 'HIGH', 'CRITICAL']),
      speciesJson: JSON.stringify(['Cão', 'Gato', 'Ave', 'Coelho', 'Outro']),
      medicationRoutesJson: JSON.stringify(['Oral', 'Intravenosa', 'Intramuscular', 'Subcutânea', 'Tópica', 'Oftálmica', 'Inalatória']),
      theme: 'light',
      tagline: 'Cuidando com amor, tratando com excelência.'
    }
  });

  console.log('Banco preparado sem dados de demonstração.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@petlife.local' },
    update: { passwordHash, active: true },
    create: {
      name: 'Administrador PetLife',
      email: 'admin@petlife.local',
      passwordHash,
      role: 'ADMIN'
    }
  });

  const tutor = await prisma.tutor.upsert({
    where: { id: 'seed-tutor-1' },
    update: {},
    create: {
      id: 'seed-tutor-1',
      name: 'Marina Alves',
      phone: '(11) 99999-0000',
      email: 'marina@example.com'
    }
  });

  const animal = await prisma.animal.upsert({
    where: { id: 'seed-animal-1' },
    update: {},
    create: {
      id: 'seed-animal-1',
      name: 'Thor',
      species: 'Cão',
      breed: 'Golden Retriever',
      weight: 29.4,
      tutorId: tutor.id
    }
  });

  const bed = await prisma.bed.upsert({
    where: { name: 'UTI-01' },
    update: {},
    create: { name: 'UTI-01', sector: 'UTI', notes: 'Monitoramento intensivo' }
  });

  for (const item of [
    { name: 'INT-01', sector: 'Internação' },
    { name: 'INT-02', sector: 'Internação' },
    { name: 'OBS-01', sector: 'Observação' },
    { name: 'ISO-01', sector: 'Isolamento' }
  ]) {
    await prisma.bed.upsert({ where: { name: item.name }, update: {}, create: item });
  }

  const existing = await prisma.hospitalization.findFirst({
    where: { animalId: animal.id, dischargedAt: null }
  });

  if (!existing) {
    const hospitalization = await prisma.hospitalization.create({
      data: {
        animalId: animal.id,
        bedId: bed.id,
        status: 'CRITICAL',
        priority: 'HIGH',
        reason: 'Monitoramento pós-operatório',
        diagnosis: 'Recuperação após procedimento abdominal',
        veterinarian: 'Dra. Camila Souza',
        notes: 'Paciente responsivo e em monitoramento contínuo',
        expectedDischargeAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    });

    const soon = new Date(Date.now() + 45 * 60 * 1000);
    await prisma.procedure.create({
      data: {
        hospitalizationId: hospitalization.id,
        title: 'Aferir sinais vitais',
        scheduledAt: soon
      }
    });
    await prisma.medicationDose.create({
      data: {
        hospitalizationId: hospitalization.id,
        medication: 'Analgésico — 1 dose IV',
        scheduledAt: soon
      }
    });
  }

  console.log('Banco SQLite preparado para a Fase 3.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  let auditLogs = 0;
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ total: bigint | number }>>('SELECT COUNT(*) as total FROM AuditLog');
    auditLogs = Number(rows[0]?.total ?? 0);
    await prisma.$executeRawUnsafe('DELETE FROM AuditLog');
  } catch {
    // A tabela de auditoria pode ainda não existir em instalações antigas.
  }

  const result = await prisma.$transaction(async (tx) => {
    const clinicalEvents = await tx.clinicalEvent.deleteMany();
    const medicationDoses = await tx.medicationDose.deleteMany();
    const prescriptions = await tx.medicationPrescription.deleteMany();
    const procedures = await tx.procedure.deleteMany();
    const hospitalizations = await tx.hospitalization.deleteMany();
    const animals = await tx.animal.deleteMany();
    const tutors = await tx.tutor.deleteMany();
    const professionals = await tx.professional.deleteMany();
    const beds = await tx.bed.deleteMany();
    const backupLogs = await tx.backupLog.deleteMany();
    const users = await tx.user.deleteMany();

    return {
      clinicalEvents: clinicalEvents.count,
      medicationDoses: medicationDoses.count,
      prescriptions: prescriptions.count,
      procedures: procedures.count,
      hospitalizations: hospitalizations.count,
      animals: animals.count,
      tutors: tutors.count,
      professionals: professionals.count,
      beds: beds.count,
      backupLogs: backupLogs.count,
      users: users.count,
      auditLogs,
    };
  });

  console.log('Dados operacionais removidos com sucesso.');
  console.table(result);
  console.log('As configurações da clínica foram preservadas.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

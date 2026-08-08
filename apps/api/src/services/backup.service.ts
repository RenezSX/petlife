import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

const BACKUP_VERSION = '2.5.0';
const BACKUP_SCHEMA_VERSION = 1;

const dateFields: Record<string, string[]> = {
  users: ['createdAt', 'updatedAt'],
  tutors: ['createdAt', 'updatedAt'],
  animals: ['birthDate', 'createdAt', 'updatedAt'],
  beds: ['createdAt', 'updatedAt'],
  hospitalizations: ['admittedAt', 'expectedDischargeAt', 'dischargedAt', 'createdAt', 'updatedAt'],
  procedures: ['scheduledAt', 'completedAt', 'createdAt', 'updatedAt'],
  medicationPrescriptions: ['startAt', 'endAt', 'createdAt', 'updatedAt'],
  medicationDoses: ['scheduledAt', 'administeredAt', 'createdAt', 'updatedAt'],
  clinicalEvents: ['eventAt', 'createdAt', 'updatedAt'],
  clinicSettings: ['createdAt', 'updatedAt'],
};

type BackupData = {
  users: Record<string, unknown>[];
  tutors: Record<string, unknown>[];
  animals: Record<string, unknown>[];
  beds: Record<string, unknown>[];
  hospitalizations: Record<string, unknown>[];
  procedures: Record<string, unknown>[];
  medicationPrescriptions: Record<string, unknown>[];
  medicationDoses: Record<string, unknown>[];
  clinicalEvents: Record<string, unknown>[];
  clinicSettings: Record<string, unknown>[];
  professionals?: Record<string, unknown>[];
};

type BackupPayload = {
  metadata: {
    app: string;
    version: string;
    schemaVersion: number;
    createdAt: string;
    counts: Record<string, number>;
  };
  data: BackupData;
};

function fileTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

function parseCounts(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function assertBackupPayload(value: unknown): asserts value is BackupPayload {
  if (!value || typeof value !== 'object') {
    throw new AppError(400, 'O arquivo de backup é inválido.');
  }

  const payload = value as Partial<BackupPayload>;
  if (!payload.metadata || payload.metadata.app !== 'PetLife') {
    throw new AppError(400, 'Este arquivo não é um backup válido do PetLife.');
  }
  if (payload.metadata.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new AppError(400, 'A versão deste backup não é compatível com a aplicação atual.');
  }
  if (!payload.data || typeof payload.data !== 'object') {
    throw new AppError(400, 'O backup não contém dados para restauração.');
  }

  for (const key of Object.keys(dateFields)) {
    if (!Array.isArray(payload.data[key as keyof BackupData])) {
      throw new AppError(400, `A coleção ${key} está ausente ou inválida no backup.`);
    }
  }
}

function restoreDates(collection: keyof BackupData, rows: Record<string, unknown>[]) {
  const fields = dateFields[collection] ?? [];
  return rows.map((row) => {
    const result = { ...row };
    for (const field of fields) {
      const value = result[field];
      if (typeof value === 'string' && value) result[field] = new Date(value);
    }
    return result;
  });
}

export async function createBackup() {
  const [users, tutors, animals, beds, hospitalizations, procedures, medicationPrescriptions, medicationDoses, clinicalEvents, clinicSettings, professionals] = await Promise.all([
    prisma.user.findMany(),
    prisma.tutor.findMany(),
    prisma.animal.findMany(),
    prisma.bed.findMany(),
    prisma.hospitalization.findMany(),
    prisma.procedure.findMany(),
    prisma.medicationPrescription.findMany(),
    prisma.medicationDose.findMany(),
    prisma.clinicalEvent.findMany(),
    prisma.clinicSettings.findMany(),
    prisma.professional.findMany(),
  ]);

  const data = {
    users,
    tutors,
    animals,
    beds,
    hospitalizations,
    procedures,
    medicationPrescriptions,
    medicationDoses,
    clinicalEvents,
    clinicSettings,
    professionals,
  };
  const counts = Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length]));
  const createdAt = new Date();
  const fileName = `petlife-backup-${fileTimestamp(createdAt)}.json`;
  const payload: BackupPayload = {
    metadata: {
      app: 'PetLife',
      version: BACKUP_VERSION,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      createdAt: createdAt.toISOString(),
      counts,
    },
    data: data as BackupData,
  };

  await prisma.backupLog.create({
    data: { action: 'EXPORT', fileName, countsJson: JSON.stringify(counts) },
  });

  return { fileName, payload };
}

export async function getBackupInfo() {
  const logs = await prisma.backupLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 });
  return {
    version: BACKUP_VERSION,
    lastBackup: logs.find((item: { action: string }) => item.action === 'EXPORT') ?? null,
    lastRestore: logs.find((item: { action: string }) => item.action === 'IMPORT') ?? null,
    history: logs.map((item: { countsJson: string; [key: string]: unknown }) => ({ ...item, counts: parseCounts(item.countsJson) })),
  };
}

export async function restoreBackup(input: unknown, originalFileName?: string) {
  assertBackupPayload(input);
  const payload = input;
  const fileName = originalFileName?.trim() || `petlife-backup-${fileTimestamp(new Date(payload.metadata.createdAt))}.json`;

  const users = restoreDates('users', payload.data.users);
  const tutors = restoreDates('tutors', payload.data.tutors);
  const animals = restoreDates('animals', payload.data.animals);
  const beds = restoreDates('beds', payload.data.beds);
  const hospitalizations = restoreDates('hospitalizations', payload.data.hospitalizations);
  const procedures = restoreDates('procedures', payload.data.procedures);
  const prescriptions = restoreDates('medicationPrescriptions', payload.data.medicationPrescriptions);
  const doses = restoreDates('medicationDoses', payload.data.medicationDoses);
  const clinicalEvents = restoreDates('clinicalEvents', payload.data.clinicalEvents);
  const clinicSettings = restoreDates('clinicSettings', payload.data.clinicSettings);
  const professionals = (payload.data.professionals ?? []).map((row) => ({ ...row, createdAt: row.createdAt ? new Date(String(row.createdAt)) : undefined, updatedAt: row.updatedAt ? new Date(String(row.updatedAt)) : undefined }));

  await prisma.$transaction(async (tx: typeof prisma) => {
    await tx.clinicalEvent.deleteMany();
    await tx.medicationDose.deleteMany();
    await tx.medicationPrescription.deleteMany();
    await tx.procedure.deleteMany();
    await tx.hospitalization.deleteMany();
    await tx.animal.deleteMany();
    await tx.tutor.deleteMany();
    await tx.professional.deleteMany();
    await tx.bed.deleteMany();
    await tx.user.deleteMany();
    await tx.clinicSettings.deleteMany();

    if (users.length) await tx.user.createMany({ data: users as any });
    if (tutors.length) await tx.tutor.createMany({ data: tutors as any });
    if (professionals.length) await tx.professional.createMany({ data: professionals as any });
    if (beds.length) await tx.bed.createMany({ data: beds as any });
    if (animals.length) await tx.animal.createMany({ data: animals as any });
    if (hospitalizations.length) await tx.hospitalization.createMany({ data: hospitalizations as any });
    if (procedures.length) await tx.procedure.createMany({ data: procedures as any });
    if (prescriptions.length) await tx.medicationPrescription.createMany({ data: prescriptions as any });
    if (doses.length) await tx.medicationDose.createMany({ data: doses as any });
    if (clinicalEvents.length) await tx.clinicalEvent.createMany({ data: clinicalEvents as any });
    if (clinicSettings.length) await tx.clinicSettings.createMany({ data: clinicSettings as any });
  });

  const counts = payload.metadata.counts;
  await prisma.backupLog.create({
    data: { action: 'IMPORT', fileName, countsJson: JSON.stringify(counts) },
  });

  return {
    message: 'Backup restaurado com sucesso.',
    restoredAt: new Date().toISOString(),
    fileName,
    counts,
  };
}

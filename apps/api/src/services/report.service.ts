import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type ReportType = 'hospitalizations' | 'procedures' | 'medications' | 'animals' | 'tutors' | 'beds';
type ReportQuery = { type?: unknown; from?: unknown; to?: unknown; status?: unknown };
type ReportColumn = { key: string; label: string };
type ReportRow = Record<string, string | number | null>;

const reportLabels: Record<ReportType, string> = {
  hospitalizations: 'Internações',
  procedures: 'Procedimentos',
  medications: 'Medicações',
  animals: 'Animais',
  tutors: 'Tutores',
  beds: 'Leitos',
};

const statusLabels: Record<string, string> = {
  WAITING: 'Aguardando', HOSPITALIZED: 'Internado', OBSERVATION: 'Observação', PROCEDURE: 'Procedimento',
  RECOVERY: 'Recuperação', CRITICAL: 'Crítico', DISCHARGE_EXPECTED: 'Alta prevista', DISCHARGED: 'Alta',
  PENDING: 'Pendente', IN_PROGRESS: 'Em andamento', COMPLETED: 'Concluído', CANCELED: 'Cancelado',
  ADMINISTERED: 'Administrada', NOT_ADMINISTERED: 'Não administrada', REFUSED: 'Recusada',
};

function dateRange(fromValue: unknown, toValue: unknown) {
  const from = String(fromValue ?? '').trim();
  const to = String(toValue ?? '').trim();
  if (!from && !to) return undefined;
  const range: { gte?: Date; lte?: Date } = {};
  if (from) range.gte = new Date(`${from}T00:00:00`);
  if (to) range.lte = new Date(`${to}T23:59:59.999`);
  return range;
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toLocaleDateString('pt-BR') : '—';
}

function formatDateTime(value: Date | null | undefined) {
  return value ? value.toLocaleString('pt-BR') : '—';
}

function labelStatus(value: string | null | undefined) {
  if (!value) return '—';
  return statusLabels[value] ?? value;
}

function result(type: ReportType, columns: ReportColumn[], rows: ReportRow[], summary: Record<string, number | string>) {
  return {
    type,
    title: reportLabels[type],
    generatedAt: new Date().toISOString(),
    columns,
    rows,
    summary: { total: rows.length, ...summary },
  };
}

async function hospitalizations(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const items = await prisma.hospitalization.findMany({
    where: {
      ...(range ? { admittedAt: range } : {}),
      ...(status === 'active' ? { dischargedAt: null } : status === 'discharged' ? { dischargedAt: { not: null } } : status !== 'all' ? { status } : {}),
    },
    include: { animal: { include: { tutor: true } }, bed: true },
    orderBy: { admittedAt: 'desc' },
  });
  const rows = items.map((item) => ({
    patient: item.animal.name,
    species: item.animal.species,
    tutor: item.animal.tutor.name,
    bed: item.bed?.name ?? 'Sem leito',
    sector: item.bed?.sector ?? '—',
    status: labelStatus(item.status),
    priority: labelStatus(item.priority),
    veterinarian: item.veterinarian ?? '—',
    admittedAt: formatDateTime(item.admittedAt),
    dischargedAt: formatDateTime(item.dischargedAt),
  }));
  return result('hospitalizations', [
    { key: 'patient', label: 'Paciente' }, { key: 'species', label: 'Espécie' }, { key: 'tutor', label: 'Tutor' },
    { key: 'bed', label: 'Leito' }, { key: 'sector', label: 'Setor' }, { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Prioridade' }, { key: 'veterinarian', label: 'Veterinário' },
    { key: 'admittedAt', label: 'Entrada' }, { key: 'dischargedAt', label: 'Alta' },
  ], rows, {
    active: items.filter((item) => !item.dischargedAt).length,
    critical: items.filter((item) => item.status === 'CRITICAL' && !item.dischargedAt).length,
    discharged: items.filter((item) => Boolean(item.dischargedAt)).length,
  });
}

async function procedures(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const items = await prisma.procedure.findMany({
    where: { ...(range ? { scheduledAt: range } : {}), ...(status !== 'all' ? { status } : {}) },
    include: { hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } } },
    orderBy: { scheduledAt: 'desc' },
  });
  const rows = items.map((item) => ({
    procedure: item.title,
    patient: item.hospitalization.animal.name,
    tutor: item.hospitalization.animal.tutor.name,
    bed: item.hospitalization.bed?.name ?? 'Sem leito',
    responsible: item.responsible ?? '—',
    status: labelStatus(item.status),
    scheduledAt: formatDateTime(item.scheduledAt),
    completedAt: formatDateTime(item.completedAt),
  }));
  return result('procedures', [
    { key: 'procedure', label: 'Procedimento' }, { key: 'patient', label: 'Paciente' }, { key: 'tutor', label: 'Tutor' },
    { key: 'bed', label: 'Leito' }, { key: 'responsible', label: 'Responsável' }, { key: 'status', label: 'Status' },
    { key: 'scheduledAt', label: 'Agendado' }, { key: 'completedAt', label: 'Concluído em' },
  ], rows, {
    pending: items.filter((item) => ['PENDING', 'IN_PROGRESS'].includes(item.status)).length,
    completed: items.filter((item) => item.status === 'COMPLETED').length,
    canceled: items.filter((item) => item.status === 'CANCELED').length,
  });
}

async function medications(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const items = await prisma.medicationDose.findMany({
    where: { ...(range ? { scheduledAt: range } : {}), ...(status !== 'all' ? { status } : {}) },
    include: { hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } } },
    orderBy: { scheduledAt: 'desc' },
  });
  const rows = items.map((item) => ({
    medication: item.medication,
    dose: [item.dose, item.unit].filter(Boolean).join(' ') || '—',
    route: item.route ?? '—',
    patient: item.hospitalization.animal.name,
    tutor: item.hospitalization.animal.tutor.name,
    bed: item.hospitalization.bed?.name ?? 'Sem leito',
    status: labelStatus(item.status),
    scheduledAt: formatDateTime(item.scheduledAt),
    administeredAt: formatDateTime(item.administeredAt),
    administeredBy: item.administeredBy ?? '—',
  }));
  return result('medications', [
    { key: 'medication', label: 'Medicamento' }, { key: 'dose', label: 'Dose' }, { key: 'route', label: 'Via' },
    { key: 'patient', label: 'Paciente' }, { key: 'tutor', label: 'Tutor' }, { key: 'bed', label: 'Leito' },
    { key: 'status', label: 'Status' }, { key: 'scheduledAt', label: 'Horário' },
    { key: 'administeredAt', label: 'Registrada em' }, { key: 'administeredBy', label: 'Responsável' },
  ], rows, {
    pending: items.filter((item) => item.status === 'PENDING').length,
    administered: items.filter((item) => item.status === 'ADMINISTERED').length,
    notAdministered: items.filter((item) => ['NOT_ADMINISTERED', 'REFUSED'].includes(item.status)).length,
  });
}

async function animals(status: string) {
  const items = await prisma.animal.findMany({
    where: status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {},
    include: { tutor: true, hospitalizations: { where: { dischargedAt: null }, select: { id: true } } },
    orderBy: { name: 'asc' },
  });
  const rows = items.map((item) => ({
    name: item.name,
    species: item.species,
    breed: item.breed ?? '—',
    sex: item.sex === 'MALE' ? 'Macho' : item.sex === 'FEMALE' ? 'Fêmea' : '—',
    weight: item.weight != null ? `${item.weight} kg` : '—',
    tutor: item.tutor.name,
    phone: item.tutor.phone,
    microchip: item.microchip ?? '—',
    status: item.active ? 'Ativo' : 'Inativo',
    hospitalized: item.hospitalizations.length ? 'Sim' : 'Não',
  }));
  return result('animals', [
    { key: 'name', label: 'Animal' }, { key: 'species', label: 'Espécie' }, { key: 'breed', label: 'Raça' },
    { key: 'sex', label: 'Sexo' }, { key: 'weight', label: 'Peso' }, { key: 'tutor', label: 'Tutor' },
    { key: 'phone', label: 'Telefone' }, { key: 'microchip', label: 'Microchip' },
    { key: 'status', label: 'Status' }, { key: 'hospitalized', label: 'Internado' },
  ], rows, { active: items.filter((item) => item.active).length, hospitalized: items.filter((item) => item.hospitalizations.length).length });
}

async function tutors(status: string) {
  const items = await prisma.tutor.findMany({
    where: status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {},
    include: { _count: { select: { animals: true } } }, orderBy: { name: 'asc' },
  });
  const rows = items.map((item) => ({
    name: item.name, cpf: item.cpf ?? '—', phone: item.phone, whatsapp: item.whatsapp ?? '—',
    email: item.email ?? '—', address: item.address ?? '—', animals: item._count.animals, status: item.active ? 'Ativo' : 'Inativo',
  }));
  return result('tutors', [
    { key: 'name', label: 'Tutor' }, { key: 'cpf', label: 'CPF' }, { key: 'phone', label: 'Telefone' },
    { key: 'whatsapp', label: 'WhatsApp' }, { key: 'email', label: 'E-mail' }, { key: 'address', label: 'Endereço' },
    { key: 'animals', label: 'Animais' }, { key: 'status', label: 'Status' },
  ], rows, { active: items.filter((item) => item.active).length, animals: items.reduce((total, item) => total + item._count.animals, 0) });
}

async function beds(status: string) {
  const items = await prisma.bed.findMany({
    where: status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {},
    include: { hospitalizations: { where: { dischargedAt: null }, include: { animal: true }, take: 1 } },
    orderBy: [{ sector: 'asc' }, { name: 'asc' }],
  });
  const rows = items.map((item) => ({
    name: item.name, sector: item.sector, status: item.active ? 'Ativo' : 'Inativo',
    occupancy: item.hospitalizations.length ? 'Ocupado' : 'Disponível', patient: item.hospitalizations[0]?.animal.name ?? '—', notes: item.notes ?? '—',
  }));
  return result('beds', [
    { key: 'name', label: 'Leito' }, { key: 'sector', label: 'Setor' }, { key: 'status', label: 'Cadastro' },
    { key: 'occupancy', label: 'Ocupação' }, { key: 'patient', label: 'Paciente' }, { key: 'notes', label: 'Observações' },
  ], rows, { available: rows.filter((row) => row.occupancy === 'Disponível').length, occupied: rows.filter((row) => row.occupancy === 'Ocupado').length });
}

export async function generateReport(query: ReportQuery) {
  const type = String(query.type ?? 'hospitalizations') as ReportType;
  const status = String(query.status ?? 'all');
  if (!(type in reportLabels)) throw new AppError(400, 'Tipo de relatório inválido.');
  if (type === 'hospitalizations') return hospitalizations(query.from, query.to, status);
  if (type === 'procedures') return procedures(query.from, query.to, status);
  if (type === 'medications') return medications(query.from, query.to, status);
  if (type === 'animals') return animals(status);
  if (type === 'tutors') return tutors(status);
  return beds(status);
}

import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type ReportType =
  | 'hospitalizations'
  | 'procedures'
  | 'medications'
  | 'prescriptions'
  | 'animals'
  | 'tutors'
  | 'beds'
  | 'professionals'
  | 'inventory'
  | 'inventoryMovements'
  | 'finance'
  | 'preventives'
  | 'clinicalEvents'
  | 'attachments';

type ReportQuery = { type?: unknown; from?: unknown; to?: unknown; status?: unknown };
type ReportColumn = { key: string; label: string };
type ReportRow = Record<string, string | number | null>;

const reportLabels: Record<ReportType, string> = {
  hospitalizations: 'Internações',
  procedures: 'Procedimentos',
  medications: 'Administração de medicações',
  prescriptions: 'Prescrições',
  animals: 'Animais',
  tutors: 'Tutores',
  beds: 'Leitos',
  professionals: 'Profissionais',
  inventory: 'Estoque',
  inventoryMovements: 'Movimentações de estoque',
  finance: 'Financeiro',
  preventives: 'Vacinas e preventivos',
  clinicalEvents: 'Registros clínicos',
  attachments: 'Anexos clínicos',
};

const statusLabels: Record<string, string> = {
  WAITING: 'Aguardando',
  HOSPITALIZED: 'Internado',
  OBSERVATION: 'Observação',
  PROCEDURE: 'Procedimento',
  RECOVERY: 'Recuperação',
  CRITICAL: 'Crítico',
  DISCHARGE_EXPECTED: 'Alta prevista',
  DISCHARGED: 'Alta',
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
  ADMINISTERED: 'Administrada',
  NOT_ADMINISTERED: 'Não administrada',
  REFUSED: 'Recusada',
  PAID: 'Pago',
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  VACCINE: 'Vacina',
  DEWORMING: 'Vermífugo',
  ANTIPARASITIC: 'Antiparasitário',
  EVOLUTION: 'Evolução',
  VITALS: 'Sinais vitais',
  OBSERVATION_NOTE: 'Observação',
  EXAM: 'Exame',
  IMAGE: 'Imagem',
  REPORT: 'Laudo',
  PRESCRIPTION: 'Receita',
  OTHER: 'Outro',
  IN: 'Entrada',
  OUT: 'Saída',
  ADJUSTMENT: 'Ajuste',
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

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
      ...(status === 'active'
        ? { dischargedAt: null }
        : status === 'discharged'
          ? { dischargedAt: { not: null } }
          : status !== 'all'
            ? { status }
            : {}),
    },
    include: { animal: { include: { tutor: true } }, bed: true },
    orderBy: { admittedAt: 'desc' },
  });

  const rows = items.map((item) => ({
    patient: item.animal.name,
    species: item.animal.species,
    breed: item.animal.breed ?? '—',
    tutor: item.animal.tutor.name,
    tutorPhone: item.animal.tutor.phone,
    bed: item.bed?.name ?? 'Sem leito',
    sector: item.bed?.sector ?? '—',
    status: labelStatus(item.status),
    priority: labelStatus(item.priority),
    veterinarian: item.veterinarian ?? '—',
    reason: item.reason,
    diagnosis: item.diagnosis ?? '—',
    admittedAt: formatDateTime(item.admittedAt),
    expectedDischargeAt: formatDateTime(item.expectedDischargeAt),
    dischargedAt: formatDateTime(item.dischargedAt),
    dischargeSummary: item.dischargeSummary ?? '—',
    notes: item.notes ?? '—',
  }));

  return result('hospitalizations', [
    { key: 'patient', label: 'Paciente' },
    { key: 'species', label: 'Espécie' },
    { key: 'breed', label: 'Raça' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'tutorPhone', label: 'Telefone tutor' },
    { key: 'bed', label: 'Leito' },
    { key: 'sector', label: 'Setor' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'veterinarian', label: 'Veterinário' },
    { key: 'reason', label: 'Motivo' },
    { key: 'diagnosis', label: 'Diagnóstico' },
    { key: 'admittedAt', label: 'Entrada' },
    { key: 'expectedDischargeAt', label: 'Alta prevista' },
    { key: 'dischargedAt', label: 'Alta realizada' },
    { key: 'dischargeSummary', label: 'Resumo da alta' },
    { key: 'notes', label: 'Observações' },
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
    description: item.description ?? '—',
    patient: item.hospitalization.animal.name,
    tutor: item.hospitalization.animal.tutor.name,
    bed: item.hospitalization.bed?.name ?? 'Sem leito',
    sector: item.hospitalization.bed?.sector ?? '—',
    responsible: item.responsible ?? '—',
    status: labelStatus(item.status),
    scheduledAt: formatDateTime(item.scheduledAt),
    completedAt: formatDateTime(item.completedAt),
    notes: item.notes ?? '—',
  }));

  return result('procedures', [
    { key: 'procedure', label: 'Procedimento' },
    { key: 'description', label: 'Descrição' },
    { key: 'patient', label: 'Paciente' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'bed', label: 'Leito' },
    { key: 'sector', label: 'Setor' },
    { key: 'responsible', label: 'Responsável' },
    { key: 'status', label: 'Status' },
    { key: 'scheduledAt', label: 'Agendado' },
    { key: 'completedAt', label: 'Concluído em' },
    { key: 'notes', label: 'Observações' },
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
    include: {
      hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } },
      inventoryItem: true,
      prescription: true,
    },
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
    inventoryItem: item.inventoryItem?.name ?? '—',
    inventoryConsumed: item.inventoryQuantity != null && item.inventoryItem
      ? `${item.inventoryQuantity} ${item.inventoryItem.unit}`
      : '—',
    notes: item.notes ?? '—',
  }));

  return result('medications', [
    { key: 'medication', label: 'Medicamento' },
    { key: 'dose', label: 'Dose' },
    { key: 'route', label: 'Via' },
    { key: 'patient', label: 'Paciente' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'bed', label: 'Leito' },
    { key: 'status', label: 'Status' },
    { key: 'scheduledAt', label: 'Horário previsto' },
    { key: 'administeredAt', label: 'Registrada em' },
    { key: 'administeredBy', label: 'Responsável' },
    { key: 'inventoryItem', label: 'Item do estoque' },
    { key: 'inventoryConsumed', label: 'Consumo de estoque' },
    { key: 'notes', label: 'Observação / justificativa' },
  ], rows, {
    pending: items.filter((item) => item.status === 'PENDING').length,
    administered: items.filter((item) => item.status === 'ADMINISTERED').length,
    notAdministered: items.filter((item) => ['NOT_ADMINISTERED', 'REFUSED'].includes(item.status)).length,
  });
}

async function prescriptions(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const items = await prisma.medicationPrescription.findMany({
    where: {
      ...(range ? { startAt: range } : {}),
      ...(status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {}),
    },
    include: {
      hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } },
      inventoryItem: true,
      doses: { select: { status: true } },
    },
    orderBy: { startAt: 'desc' },
  });

  const rows = items.map((item) => ({
    medication: item.medication,
    dose: `${item.dose} ${item.unit}`,
    route: item.route,
    frequency: `A cada ${item.frequencyHours}h`,
    patient: item.hospitalization.animal.name,
    tutor: item.hospitalization.animal.tutor.name,
    responsible: item.responsible ?? '—',
    startAt: formatDateTime(item.startAt),
    endAt: formatDateTime(item.endAt),
    status: item.active ? 'Ativa' : 'Suspensa',
    generatedDoses: item.doses.length,
    administeredDoses: item.doses.filter((dose) => dose.status === 'ADMINISTERED').length,
    pendingDoses: item.doses.filter((dose) => dose.status === 'PENDING').length,
    inventoryItem: item.inventoryItem?.name ?? '—',
    inventoryPerDose: item.inventoryQuantity != null && item.inventoryItem
      ? `${item.inventoryQuantity} ${item.inventoryItem.unit}`
      : '—',
    notes: item.notes ?? '—',
  }));

  return result('prescriptions', [
    { key: 'medication', label: 'Medicamento' },
    { key: 'dose', label: 'Dose' },
    { key: 'route', label: 'Via' },
    { key: 'frequency', label: 'Frequência' },
    { key: 'patient', label: 'Paciente' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'responsible', label: 'Profissional' },
    { key: 'startAt', label: 'Início' },
    { key: 'endAt', label: 'Término' },
    { key: 'status', label: 'Situação' },
    { key: 'generatedDoses', label: 'Doses geradas' },
    { key: 'administeredDoses', label: 'Administradas' },
    { key: 'pendingDoses', label: 'Pendentes' },
    { key: 'inventoryItem', label: 'Estoque vinculado' },
    { key: 'inventoryPerDose', label: 'Consumo / dose' },
    { key: 'notes', label: 'Observações' },
  ], rows, {
    active: items.filter((item) => item.active).length,
    inactive: items.filter((item) => !item.active).length,
    administered: items.reduce((sum, item) => sum + item.doses.filter((dose) => dose.status === 'ADMINISTERED').length, 0),
    pending: items.reduce((sum, item) => sum + item.doses.filter((dose) => dose.status === 'PENDING').length, 0),
  });
}

async function animals(status: string) {
  const items = await prisma.animal.findMany({
    where: status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {},
    include: {
      tutor: true,
      hospitalizations: { where: { dischargedAt: null }, select: { id: true } },
      preventives: { orderBy: { appliedAt: 'desc' }, take: 1 },
    },
    orderBy: { name: 'asc' },
  });

  const rows = items.map((item) => ({
    name: item.name,
    species: item.species,
    breed: item.breed ?? '—',
    sex: item.sex === 'MALE' ? 'Macho' : item.sex === 'FEMALE' ? 'Fêmea' : '—',
    birthDate: formatDate(item.birthDate),
    approximateAge: item.approximateAge ?? '—',
    weight: item.weight != null ? `${item.weight} kg` : '—',
    color: item.color ?? '—',
    neutered: item.neutered ? 'Sim' : 'Não',
    tutor: item.tutor.name,
    phone: item.tutor.phone,
    microchip: item.microchip ?? '—',
    allergies: item.allergies ?? '—',
    previousDiseases: item.previousDiseases ?? '—',
    continuousMedications: item.continuousMedications ?? '—',
    status: item.active ? 'Ativo' : 'Inativo',
    hospitalized: item.hospitalizations.length ? 'Sim' : 'Não',
    lastPreventive: item.preventives[0]?.name ?? '—',
    nextPreventive: formatDate(item.preventives[0]?.nextDueAt),
  }));

  return result('animals', [
    { key: 'name', label: 'Animal' },
    { key: 'species', label: 'Espécie' },
    { key: 'breed', label: 'Raça' },
    { key: 'sex', label: 'Sexo' },
    { key: 'birthDate', label: 'Nascimento' },
    { key: 'approximateAge', label: 'Idade aproximada' },
    { key: 'weight', label: 'Peso' },
    { key: 'color', label: 'Cor' },
    { key: 'neutered', label: 'Castrado' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'phone', label: 'Telefone' },
    { key: 'microchip', label: 'Microchip' },
    { key: 'allergies', label: 'Alergias' },
    { key: 'previousDiseases', label: 'Doenças prévias' },
    { key: 'continuousMedications', label: 'Medicações contínuas' },
    { key: 'status', label: 'Status' },
    { key: 'hospitalized', label: 'Internado' },
    { key: 'lastPreventive', label: 'Último preventivo' },
    { key: 'nextPreventive', label: 'Próxima dose' },
  ], rows, {
    active: items.filter((item) => item.active).length,
    inactive: items.filter((item) => !item.active).length,
    hospitalized: items.filter((item) => item.hospitalizations.length).length,
  });
}

async function tutors(status: string) {
  const items = await prisma.tutor.findMany({
    where: status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {},
    include: { animals: { select: { name: true, species: true } }, _count: { select: { animals: true } } },
    orderBy: { name: 'asc' },
  });

  const rows = items.map((item) => ({
    name: item.name,
    cpf: item.cpf ?? '—',
    phone: item.phone,
    whatsapp: item.whatsapp ?? '—',
    email: item.email ?? '—',
    address: item.address ?? '—',
    animals: item._count.animals,
    animalNames: item.animals.map((animal) => `${animal.name} (${animal.species})`).join(', ') || '—',
    status: item.active ? 'Ativo' : 'Inativo',
    notes: item.notes ?? '—',
  }));

  return result('tutors', [
    { key: 'name', label: 'Tutor' },
    { key: 'cpf', label: 'CPF' },
    { key: 'phone', label: 'Telefone' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'email', label: 'E-mail' },
    { key: 'address', label: 'Endereço' },
    { key: 'animals', label: 'Qtd. animais' },
    { key: 'animalNames', label: 'Animais' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Observações' },
  ], rows, {
    active: items.filter((item) => item.active).length,
    inactive: items.filter((item) => !item.active).length,
    animals: items.reduce((total, item) => total + item._count.animals, 0),
  });
}

async function beds(status: string) {
  const items = await prisma.bed.findMany({
    where: status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {},
    include: { hospitalizations: { where: { dischargedAt: null }, include: { animal: true }, take: 1 } },
    orderBy: [{ sector: 'asc' }, { name: 'asc' }],
  });

  const rows = items.map((item) => ({
    name: item.name,
    sector: item.sector,
    status: item.active ? 'Ativo' : 'Inativo',
    occupancy: item.hospitalizations.length ? 'Ocupado' : 'Disponível',
    patient: item.hospitalizations[0]?.animal.name ?? '—',
    notes: item.notes ?? '—',
  }));

  return result('beds', [
    { key: 'name', label: 'Leito' },
    { key: 'sector', label: 'Setor' },
    { key: 'status', label: 'Cadastro' },
    { key: 'occupancy', label: 'Ocupação' },
    { key: 'patient', label: 'Paciente' },
    { key: 'notes', label: 'Observações' },
  ], rows, {
    available: rows.filter((row) => row.occupancy === 'Disponível').length,
    occupied: rows.filter((row) => row.occupancy === 'Ocupado').length,
    active: items.filter((item) => item.active).length,
  });
}

async function professionals(status: string) {
  const items = await prisma.professional.findMany({
    where: status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {},
    orderBy: { name: 'asc' },
  });

  const rows = items.map((item) => ({
    name: item.name,
    role: item.role,
    crmv: item.crmv ?? '—',
    specialty: item.specialty ?? '—',
    phone: item.phone ?? '—',
    email: item.email ?? '—',
    status: item.active ? 'Ativo' : 'Inativo',
    notes: item.notes ?? '—',
    createdAt: formatDate(item.createdAt),
  }));

  return result('professionals', [
    { key: 'name', label: 'Profissional' },
    { key: 'role', label: 'Função' },
    { key: 'crmv', label: 'CRMV' },
    { key: 'specialty', label: 'Especialidade' },
    { key: 'phone', label: 'Telefone' },
    { key: 'email', label: 'E-mail' },
    { key: 'status', label: 'Status' },
    { key: 'notes', label: 'Observações' },
    { key: 'createdAt', label: 'Cadastrado em' },
  ], rows, {
    active: items.filter((item) => item.active).length,
    inactive: items.filter((item) => !item.active).length,
  });
}

async function inventory(status: string) {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const items = await prisma.inventoryItem.findMany({
    where:
      status === 'active' ? { active: true }
        : status === 'inactive' ? { active: false }
          : status === 'low' ? { active: true }
            : status === 'zero' ? { active: true, currentQuantity: { lte: 0 } }
              : {},
    orderBy: { name: 'asc' },
  });

  const filtered = status === 'low'
    ? items.filter((item) => item.currentQuantity <= item.minimumQuantity)
    : status === 'expired'
      ? items.filter((item) => item.expiryDate && item.expiryDate < now)
      : status === 'expiring'
        ? items.filter((item) => item.expiryDate && item.expiryDate >= now && item.expiryDate <= thirtyDays)
        : items;

  const rows = filtered.map((item) => ({
    name: item.name,
    category: labelStatus(item.category),
    quantity: item.currentQuantity,
    unit: item.unit,
    minimum: item.minimumQuantity,
    stockStatus: item.currentQuantity <= 0 ? 'Esgotado' : item.currentQuantity <= item.minimumQuantity ? 'Baixo' : 'Normal',
    batch: item.batch ?? '—',
    expiryDate: formatDate(item.expiryDate),
    expiryStatus: item.expiryDate
      ? item.expiryDate < now ? 'Vencido' : item.expiryDate <= thirtyDays ? 'Próximo do vencimento' : 'Válido'
      : 'Sem validade',
    supplier: item.supplier ?? '—',
    location: item.location ?? '—',
    status: item.active ? 'Ativo' : 'Inativo',
    notes: item.notes ?? '—',
  }));

  return result('inventory', [
    { key: 'name', label: 'Item' },
    { key: 'category', label: 'Categoria' },
    { key: 'quantity', label: 'Quantidade' },
    { key: 'unit', label: 'Unidade' },
    { key: 'minimum', label: 'Estoque mínimo' },
    { key: 'stockStatus', label: 'Situação do estoque' },
    { key: 'batch', label: 'Lote' },
    { key: 'expiryDate', label: 'Validade' },
    { key: 'expiryStatus', label: 'Situação da validade' },
    { key: 'supplier', label: 'Fornecedor' },
    { key: 'location', label: 'Localização' },
    { key: 'status', label: 'Cadastro' },
    { key: 'notes', label: 'Observações' },
  ], rows, {
    active: filtered.filter((item) => item.active).length,
    low: filtered.filter((item) => item.currentQuantity <= item.minimumQuantity).length,
    zero: filtered.filter((item) => item.currentQuantity <= 0).length,
    expired: filtered.filter((item) => item.expiryDate && item.expiryDate < now).length,
    expiring: filtered.filter((item) => item.expiryDate && item.expiryDate >= now && item.expiryDate <= thirtyDays).length,
  });
}

async function inventoryMovements(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const items = await prisma.inventoryMovement.findMany({
    where: {
      ...(range ? { createdAt: range } : {}),
      ...(status !== 'all' ? { type: status } : {}),
    },
    include: { item: true },
    orderBy: { createdAt: 'desc' },
  });

  const rows = items.map((movement) => ({
    date: formatDateTime(movement.createdAt),
    item: movement.item.name,
    type: labelStatus(movement.type),
    quantity: `${movement.quantity} ${movement.item.unit}`,
    before: `${movement.beforeQty} ${movement.item.unit}`,
    after: `${movement.afterQty} ${movement.item.unit}`,
    reason: movement.reason,
    responsible: movement.responsible ?? '—',
    batch: movement.item.batch ?? '—',
    notes: movement.notes ?? '—',
  }));

  return result('inventoryMovements', [
    { key: 'date', label: 'Data' },
    { key: 'item', label: 'Item' },
    { key: 'type', label: 'Movimentação' },
    { key: 'quantity', label: 'Quantidade' },
    { key: 'before', label: 'Saldo anterior' },
    { key: 'after', label: 'Saldo final' },
    { key: 'reason', label: 'Motivo' },
    { key: 'responsible', label: 'Responsável' },
    { key: 'batch', label: 'Lote' },
    { key: 'notes', label: 'Observações' },
  ], rows, {
    entries: items.filter((item) => item.type === 'IN').length,
    exits: items.filter((item) => item.type === 'OUT').length,
    adjustments: items.filter((item) => item.type === 'ADJUSTMENT').length,
  });
}

async function finance(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const items = await prisma.financialEntry.findMany({
    where: {
      ...(range ? { occurredAt: range } : {}),
      ...(status === 'income'
        ? { type: 'INCOME' }
        : status === 'expense'
          ? { type: 'EXPENSE' }
          : status !== 'all'
            ? { status }
            : {}),
    },
    include: { animal: { include: { tutor: true } }, hospitalization: true },
    orderBy: { occurredAt: 'desc' },
  });

  const rows = items.map((item) => ({
    date: formatDate(item.occurredAt),
    type: labelStatus(item.type),
    description: item.description,
    category: item.category,
    amount: formatMoney(item.amount),
    status: labelStatus(item.status),
    paymentMethod: item.paymentMethod ?? '—',
    dueAt: formatDate(item.dueAt),
    paidAt: formatDate(item.paidAt),
    patient: item.animal?.name ?? '—',
    tutor: item.animal?.tutor.name ?? '—',
    hospitalization: item.hospitalizationId ?? '—',
    notes: item.notes ?? '—',
  }));

  const paidIncome = items.filter((item) => item.type === 'INCOME' && item.status === 'PAID').reduce((sum, item) => sum + item.amount, 0);
  const paidExpense = items.filter((item) => item.type === 'EXPENSE' && item.status === 'PAID').reduce((sum, item) => sum + item.amount, 0);
  const pending = items.filter((item) => item.status === 'PENDING').reduce((sum, item) => sum + item.amount, 0);

  return result('finance', [
    { key: 'date', label: 'Data' },
    { key: 'type', label: 'Tipo' },
    { key: 'description', label: 'Descrição' },
    { key: 'category', label: 'Categoria' },
    { key: 'amount', label: 'Valor' },
    { key: 'status', label: 'Status' },
    { key: 'paymentMethod', label: 'Pagamento' },
    { key: 'dueAt', label: 'Vencimento' },
    { key: 'paidAt', label: 'Pagamento em' },
    { key: 'patient', label: 'Paciente' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'hospitalization', label: 'Internação' },
    { key: 'notes', label: 'Observações' },
  ], rows, {
    income: formatMoney(paidIncome),
    expense: formatMoney(paidExpense),
    balance: formatMoney(paidIncome - paidExpense),
    pendingAmount: formatMoney(pending),
  });
}

async function preventives(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const items = await prisma.preventiveRecord.findMany({
    where: {
      ...(range ? { appliedAt: range } : {}),
      ...(status !== 'all' && !['overdue', 'dueSoon'].includes(status) ? { type: status } : {}),
    },
    include: { animal: { include: { tutor: true } }, professional: true },
    orderBy: { appliedAt: 'desc' },
  });

  const filtered = status === 'overdue'
    ? items.filter((item) => item.nextDueAt && item.nextDueAt < now)
    : status === 'dueSoon'
      ? items.filter((item) => item.nextDueAt && item.nextDueAt >= now && item.nextDueAt <= soon)
      : items;

  const rows = filtered.map((item) => ({
    type: labelStatus(item.type),
    name: item.name,
    patient: item.animal.name,
    species: item.animal.species,
    tutor: item.animal.tutor.name,
    phone: item.animal.tutor.phone,
    manufacturer: item.manufacturer ?? '—',
    batch: item.batch ?? '—',
    appliedAt: formatDate(item.appliedAt),
    nextDueAt: formatDate(item.nextDueAt),
    dueStatus: item.nextDueAt
      ? item.nextDueAt < now ? 'Atrasado' : item.nextDueAt <= soon ? 'Próximo' : 'Em dia'
      : 'Sem próxima dose',
    responsible: item.responsible ?? '—',
    notes: item.notes ?? '—',
  }));

  return result('preventives', [
    { key: 'type', label: 'Tipo' },
    { key: 'name', label: 'Preventivo' },
    { key: 'patient', label: 'Paciente' },
    { key: 'species', label: 'Espécie' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'phone', label: 'Telefone' },
    { key: 'manufacturer', label: 'Fabricante' },
    { key: 'batch', label: 'Lote' },
    { key: 'appliedAt', label: 'Aplicação' },
    { key: 'nextDueAt', label: 'Próxima dose' },
    { key: 'dueStatus', label: 'Situação' },
    { key: 'responsible', label: 'Profissional' },
    { key: 'notes', label: 'Observações' },
  ], rows, {
    vaccines: filtered.filter((item) => item.type === 'VACCINE').length,
    deworming: filtered.filter((item) => item.type === 'DEWORMING').length,
    antiparasitic: filtered.filter((item) => item.type === 'ANTIPARASITIC').length,
    overdue: filtered.filter((item) => item.nextDueAt && item.nextDueAt < now).length,
    dueSoon: filtered.filter((item) => item.nextDueAt && item.nextDueAt >= now && item.nextDueAt <= soon).length,
  });
}

async function clinicalEvents(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const items = await prisma.clinicalEvent.findMany({
    where: {
      ...(range ? { eventAt: range } : {}),
      ...(status !== 'all' ? { type: status } : {}),
    },
    include: { hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } } },
    orderBy: { eventAt: 'desc' },
  });

  const rows = items.map((item) => ({
    date: formatDateTime(item.eventAt),
    type: labelStatus(item.type),
    title: item.title,
    patient: item.hospitalization.animal.name,
    tutor: item.hospitalization.animal.tutor.name,
    bed: item.hospitalization.bed?.name ?? 'Sem leito',
    responsible: item.responsible ?? '—',
    description: item.description,
    temperature: item.temperature != null ? `${item.temperature} °C` : '—',
    heartRate: item.heartRate != null ? `${item.heartRate} bpm` : '—',
    respiratoryRate: item.respiratoryRate != null ? `${item.respiratoryRate} irpm` : '—',
    weight: item.weight != null ? `${item.weight} kg` : '—',
  }));

  return result('clinicalEvents', [
    { key: 'date', label: 'Data' },
    { key: 'type', label: 'Tipo' },
    { key: 'title', label: 'Registro' },
    { key: 'patient', label: 'Paciente' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'bed', label: 'Leito' },
    { key: 'responsible', label: 'Responsável' },
    { key: 'description', label: 'Descrição' },
    { key: 'temperature', label: 'Temperatura' },
    { key: 'heartRate', label: 'Freq. cardíaca' },
    { key: 'respiratoryRate', label: 'Freq. respiratória' },
    { key: 'weight', label: 'Peso' },
  ], rows, {
    evolutions: items.filter((item) => item.type === 'EVOLUTION').length,
    vitals: items.filter((item) => item.type === 'VITALS').length,
    observations: items.filter((item) => item.type === 'OBSERVATION').length,
  });
}

async function attachments(from: unknown, to: unknown, status: string) {
  const range = dateRange(from, to);
  const items = await prisma.clinicalAttachment.findMany({
    where: {
      ...(range ? { createdAt: range } : {}),
      ...(status !== 'all' ? { category: status } : {}),
    },
    include: { animal: { include: { tutor: true } }, hospitalization: true, professional: true },
    orderBy: { createdAt: 'desc' },
  });

  const rows = items.map((item) => ({
    date: formatDateTime(item.createdAt),
    category: labelStatus(item.category),
    fileName: item.fileName,
    mimeType: item.mimeType,
    size: `${(item.sizeBytes / 1024).toFixed(1)} KB`,
    patient: item.animal.name,
    tutor: item.animal.tutor.name,
    hospitalization: item.hospitalizationId ?? '—',
    responsible: item.professionalName ?? item.professional?.name ?? '—',
    description: item.description ?? '—',
  }));

  return result('attachments', [
    { key: 'date', label: 'Data' },
    { key: 'category', label: 'Categoria' },
    { key: 'fileName', label: 'Arquivo' },
    { key: 'mimeType', label: 'Tipo de arquivo' },
    { key: 'size', label: 'Tamanho' },
    { key: 'patient', label: 'Paciente' },
    { key: 'tutor', label: 'Tutor' },
    { key: 'hospitalization', label: 'Internação' },
    { key: 'responsible', label: 'Responsável' },
    { key: 'description', label: 'Descrição' },
  ], rows, {
    exams: items.filter((item) => item.category === 'EXAM').length,
    images: items.filter((item) => item.category === 'IMAGE').length,
    reports: items.filter((item) => item.category === 'REPORT').length,
    prescriptions: items.filter((item) => item.category === 'PRESCRIPTION').length,
  });
}

export async function generateReport(query: ReportQuery) {
  const type = String(query.type ?? 'hospitalizations') as ReportType;
  const status = String(query.status ?? 'all');

  if (!(type in reportLabels)) throw new AppError(400, 'Tipo de relatório inválido.');

  if (type === 'hospitalizations') return hospitalizations(query.from, query.to, status);
  if (type === 'procedures') return procedures(query.from, query.to, status);
  if (type === 'medications') return medications(query.from, query.to, status);
  if (type === 'prescriptions') return prescriptions(query.from, query.to, status);
  if (type === 'animals') return animals(status);
  if (type === 'tutors') return tutors(status);
  if (type === 'beds') return beds(status);
  if (type === 'professionals') return professionals(status);
  if (type === 'inventory') return inventory(status);
  if (type === 'inventoryMovements') return inventoryMovements(query.from, query.to, status);
  if (type === 'finance') return finance(query.from, query.to, status);
  if (type === 'preventives') return preventives(query.from, query.to, status);
  if (type === 'clinicalEvents') return clinicalEvents(query.from, query.to, status);
  return attachments(query.from, query.to, status);
}

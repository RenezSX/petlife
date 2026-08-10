import { prisma } from '../config/prisma.js';

type SettingsInput = {
  name: string;
  legalName?: string | null;
  cnpj?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  logoDataUrl?: string | null;
  openingHours?: string | null;
  sectors: string[];
  priorities: string[];
  species: string[];
  medicationRoutes: string[];
  theme: 'light' | 'dark' | 'system';
  tagline: string;
};

const defaults = {
  id: 'clinic',
  name: 'PetLife',
  openingHours: 'Atendimento 24 horas',
  sectorsJson: JSON.stringify(['Internação', 'UTI', 'Observação', 'Isolamento']),
  prioritiesJson: JSON.stringify(['NORMAL', 'HIGH', 'CRITICAL']),
  speciesJson: JSON.stringify(['Cão', 'Gato', 'Ave', 'Coelho', 'Outro']),
  medicationRoutesJson: JSON.stringify(['Oral', 'Intravenosa', 'Intramuscular', 'Subcutânea', 'Tópica', 'Oftálmica', 'Inalatória']),
  theme: 'light',
  tagline: 'Cuidando com amor, tratando com excelência.',
};

function parseList(value: string) {
  try {
    const result = JSON.parse(value);
    return Array.isArray(result) ? result.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function serialize(item: Awaited<ReturnType<typeof prisma.clinicSettings.findUnique>>) {
  if (!item) return null;
  return {
    ...item,
    sectors: parseList(item.sectorsJson),
    priorities: parseList(item.prioritiesJson),
    species: parseList(item.speciesJson),
    medicationRoutes: parseList(item.medicationRoutesJson),
  };
}

export async function getSettings() {
  const item = await prisma.clinicSettings.upsert({
    where: { id: 'clinic' },
    update: {},
    create: defaults,
  });
  return serialize(item);
}

export async function updateSettings(data: SettingsInput) {
  const item = await prisma.clinicSettings.upsert({
    where: { id: 'clinic' },
    update: {
      name: data.name,
      legalName: data.legalName || null,
      cnpj: data.cnpj || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      logoDataUrl: data.logoDataUrl || null,
      openingHours: data.openingHours || null,
      sectorsJson: JSON.stringify(data.sectors),
      prioritiesJson: JSON.stringify(data.priorities),
      speciesJson: JSON.stringify(data.species),
      medicationRoutesJson: JSON.stringify(data.medicationRoutes),
      theme: data.theme,
      tagline: data.tagline,
    },
    create: {
      id: 'clinic',
      name: data.name,
      legalName: data.legalName || null,
      cnpj: data.cnpj || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      logoDataUrl: data.logoDataUrl || null,
      openingHours: data.openingHours || null,
      sectorsJson: JSON.stringify(data.sectors),
      prioritiesJson: JSON.stringify(data.priorities),
      speciesJson: JSON.stringify(data.species),
      medicationRoutesJson: JSON.stringify(data.medicationRoutes),
      theme: data.theme,
      tagline: data.tagline,
    },
  });
  return serialize(item);
}

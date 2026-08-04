export type User = { id: string; name: string; email: string; role: 'ADMIN' | 'VETERINARIAN' | 'ASSISTANT' | 'RECEPTIONIST' };
export type RecentHospitalization = { id: string; animal: string; species: string; tutor: string; bed: string; status: string; priority: string; admittedAt: string };
export type DashboardData = { metrics: { hospitalized: number; critical: number; pendingProcedures: number; pendingMedications: number }; recent: RecentHospitalization[] };

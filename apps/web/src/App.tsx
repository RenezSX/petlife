import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TutorsPage } from './pages/TutorsPage';
import { AnimalsPage } from './pages/AnimalsPage';
import { HospitalizationsPage } from './pages/HospitalizationsPage';
import { BedsPage } from './pages/BedsPage';
import { ProceduresPage } from './pages/ProceduresPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { HospitalizationTimelinePage } from './pages/HospitalizationTimelinePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClinicSettingsProvider } from './contexts/ClinicSettingsContext';
import { AuditPage } from './pages/AuditPage';
import { ProfessionalsPage } from './pages/ProfessionalsPage';
import { AgendaPage } from './pages/AgendaPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { IdentificationPage } from './pages/IdentificationPage';
import { InventoryPage } from './pages/InventoryPage';
import { FinancePage } from './pages/FinancePage';
import { PreventivesPage } from './pages/PreventivesPage';

export default function App() {
  return (
    <ClinicSettingsProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/documentos" element={<DocumentsPage />} />
          <Route path="/tutores" element={<TutorsPage />} />
          <Route path="/animais" element={<AnimalsPage />} />
          <Route path="/identificar" element={<IdentificationPage />} />

          <Route path="/internacoes" element={<HospitalizationsPage />} />
          <Route path="/internacoes/:id" element={<HospitalizationTimelinePage />} />

          <Route path="/procedimentos" element={<ProceduresPage />} />

          <Route path="/medicacoes" element={<MedicationsPage />} />

          <Route path="/estoque" element={<InventoryPage />} />
          <Route path="/financeiro" element={<FinancePage />} />
          <Route path="/preventivos" element={<PreventivesPage />} />

          <Route path="/leitos" element={<BedsPage />} />

          <Route path="/profissionais" element={<ProfessionalsPage />} />

          <Route path="/relatorios" element={<ReportsPage />} />

          <Route path="/auditoria" element={<AuditPage />} />

          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </ClinicSettingsProvider>
  );
}
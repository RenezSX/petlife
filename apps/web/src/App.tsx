import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { TutorsPage } from './pages/TutorsPage';
import { AnimalsPage } from './pages/AnimalsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tutores" element={<TutorsPage />} />
          <Route path="/animais" element={<AnimalsPage />} />

          <Route
            path="/internacoes"
            element={<PlaceholderPage title="Internações" />}
          />

          <Route
            path="/procedimentos"
            element={<PlaceholderPage title="Procedimentos" />}
          />

          <Route
            path="/medicacoes"
            element={<PlaceholderPage title="Medicações" />}
          />

          <Route
            path="/leitos"
            element={<PlaceholderPage title="Leitos" />}
          />

          <Route
            path="/profissionais"
            element={<PlaceholderPage title="Profissionais" />}
          />

          <Route
            path="/relatorios"
            element={<PlaceholderPage title="Relatórios" />}
          />

          <Route
            path="/configuracoes"
            element={<PlaceholderPage title="Configurações" />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
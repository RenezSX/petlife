import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { AnimalsPage } from './pages/AnimalsPage';
import { TutorsPage } from './pages/TutorsPage';
export default function App() { return <BrowserRouter><AuthProvider><Routes>
  <Route path="/login" element={<LoginPage/>}/>
  <Route element={<ProtectedRoute/>}><Route element={<AppLayout/>}>
    <Route index element={<DashboardPage/>}/>
    <Route path="internacoes" element={<PlaceholderPage title="Internações"/>}/>
    <Route path="animais" element={<AnimalsPage/>}/>
    <Route path="tutores" element={<TutorsPage/>}/>
    <Route path="profissionais" element={<PlaceholderPage title="Profissionais"/>}/>
  </Route></Route>
  <Route path="*" element={<LoginPage/>}/>
</Routes></AuthProvider></BrowserRouter>; }

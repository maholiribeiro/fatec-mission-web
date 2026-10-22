import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/Layout';
import { LogoIcon } from './components/Logo';
import { EmptyState } from './components/ui';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Home from './pages/Home';
import Missoes from './pages/Missoes';
import MissaoDetalhe from './pages/MissaoDetalhe';
import Quiz from './pages/Quiz';
import Ranking from './pages/Ranking';
import Conquistas from './pages/Conquistas';
import Perfil from './pages/Perfil';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMissoes from './pages/admin/AdminMissoes';
import MissaoForm from './pages/admin/MissaoForm';
import { Compass } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

/** Cada tela abre no topo (o React Router preserva a rolagem entre rotas). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Splash() {
  return (
    <div className="splash" role="status" aria-label="Carregando">
      <LogoIcon size={72} />
    </div>
  );
}

/** Exige login; guarda a rota de origem para voltar após autenticar. */
function Privada() {
  const { autenticado, carregando, perfil } = useAuth();
  const location = useLocation();
  if (!autenticado) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (carregando && !perfil) return <Splash />;
  return <Outlet />;
}

function SomenteAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

function Publica() {
  const { autenticado } = useAuth();
  return autenticado ? <Navigate to="/" replace /> : <Outlet />;
}

function NaoEncontrada() {
  return (
    <div className="page-content page-content--no-tabs">
      <EmptyState
        icon={Compass}
        title="Rota fora do mapa"
        action={<Link to="/" className="btn btn--primary btn--sm">Voltar ao início</Link>}
      >
        Esta página não existe.
      </EmptyState>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Routes>
        <Route element={<Publica />}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
        </Route>

        <Route element={<Privada />}>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="/missoes" element={<Missoes />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/conquistas" element={<Conquistas />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
          <Route path="/missoes/:id" element={<MissaoDetalhe />} />
          <Route path="/missoes/:id/quiz" element={<Quiz />} />

          <Route element={<SomenteAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/missoes" element={<AdminMissoes />} />
            <Route path="/admin/missoes/nova" element={<MissaoForm />} />
            <Route path="/admin/missoes/:id" element={<MissaoForm />} />
          </Route>
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </div>
  );
}

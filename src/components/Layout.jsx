import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Award, ChevronLeft, Crosshair, House, Trophy, User, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USE_MOCK } from '../api/client';
import { LogoIcon } from './Logo';
import { formatarXp } from '../utils/rules';

const ABAS = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/missoes', label: 'Missões', icon: Crosshair },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/conquistas', label: 'Conquistas', icon: Award },
  { to: '/perfil', label: 'Perfil', icon: User },
];

export function XpPill() {
  const { perfil } = useAuth();
  if (!perfil) return null;
  return (
    <span className="xp-pill" aria-label={`${perfil.xp} de XP`}>
      <Zap size={15} aria-hidden="true" />
      {formatarXp(perfil.xp)} XP
    </span>
  );
}

/** Layout das telas principais: barra superior com a marca + navegação inferior. */
export function AppLayout() {
  return (
    <>
      <header className="topbar">
        <div className="brand-mini">
          <LogoIcon size={30} />
          <span className="brand-mini__word">
            FATEC <b>MISSION</b>
          </span>
          {USE_MOCK && <span className="demo-badge">DEMO</span>}
        </div>
        <XpPill />
      </header>
      <main>
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Navegação principal">
        {ABAS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="tabbar__item">
            <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

/** Barra superior das telas internas (com voltar). */
export function SubHeader({ title, right, backTo, onBack }) {
  const navigate = useNavigate();
  return (
    <header className="topbar topbar--sub">
      <button
        className="icon-btn"
        onClick={() =>
          onBack ? onBack() : backTo ? navigate(backTo) : window.history.length > 1 ? navigate(-1) : navigate('/')
        }
        aria-label="Voltar"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="topbar__title">{title}</h1>
      {right}
    </header>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Crosshair, LogOut, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USE_MOCK } from '../api/client';
import { Button, Dificuldade, EmptyState, HudCard, SectionHead, Sheet, Skeleton } from '../components/ui';
import Badge from '../components/Badge';
import { formatarXp, iniciais } from '../utils/rules';

export default function Perfil() {
  const { perfil, logout, recarregarPerfil, isAdmin } = useAuth();
  const [sair, setSair] = useState(false);

  useEffect(() => {
    recarregarPerfil().catch(() => {});
  }, [recarregarPerfil]);

  if (!perfil) {
    return (
      <div className="page-content stack">
        <Skeleton h={140} />
        <Skeleton h={80} />
      </div>
    );
  }

  const resetDemo = async () => {
    const { resetMock } = await import('../api/mock.js');
    resetMock();
    window.location.reload();
  };

  return (
    <div className="page page-content stack-lg profile">
      <section className="profile__head">
        <div className="profile__tex tex-dots tex-fade-left" aria-hidden="true" />
        <span className="avatar avatar--lg avatar--red">{iniciais(perfil.nome)}</span>
        <div className="profile__id">
          {isAdmin && <span className="tag tag--red">Administrador</span>}
          <h1 className="profile__name">{perfil.nome}</h1>
          <p className="subtle">{perfil.email}</p>
          <p className="muted profile__course">
            {perfil.curso}
            {!isAdmin && ` · ${perfil.semestre}º semestre`}
          </p>
        </div>
      </section>

      <div className="stat-row">
        <Stat valor={formatarXp(perfil.xp)} rotulo="XP total" destaque />
        <Stat valor={perfil.posicao_ranking ? `#${perfil.posicao_ranking}` : '—'} rotulo="Ranking" />
        <Stat valor={perfil.total_missoes_concluidas} rotulo="Missões" />
      </div>

      {isAdmin && (
        <HudCard as={Link} to="/admin" tone="strong" bodyClassName="hud__body admin-entry">
          <ShieldCheck size={26} className="red-icon" aria-hidden="true" />
          <span>
            <strong>Painel administrativo</strong>
            <small>Indicadores e gestão de missões</small>
          </span>
          <ChevronRight size={20} aria-hidden="true" />
        </HudCard>
      )}

      <section>
        <SectionHead title="Conquistas" action={<Link className="section-link" to="/conquistas">Ver todas <ChevronRight size={16} /></Link>} />
        {perfil.conquistas.length ? (
          <div className="chip-row badge-strip">
            {perfil.conquistas.map((c) => (
              <Link key={c.conquista_id} to="/conquistas" className="badge-strip__item">
                <Badge conquista={c} size={56} />
                <span>{c.nome}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Nenhuma conquista ainda.</p>
        )}
      </section>

      <section>
        <SectionHead title="Missões cumpridas" />
        {perfil.missoes_concluidas.length ? (
          <ul className="done-list">
            {perfil.missoes_concluidas.map((m) => (
              <li key={m.missao_id}>
                <Link to={`/missoes/${m.missao_id}`} className="done-row">
                  <span className="done-row__title">{m.titulo}</span>
                  <Dificuldade valor={m.dificuldade} mostrarTexto={false} />
                  <span className="done-row__xp">+{m.xp_ganho}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Crosshair} title="Nenhuma missão ainda" action={<Link to="/missoes" className="btn btn--primary btn--sm">Ver missões</Link>} />
        )}
      </section>

      <div className="stack">
        <Button variant="ghost" block onClick={() => setSair(true)}>
          <LogOut size={18} /> Sair da conta
        </Button>
        {USE_MOCK && (
          <Button variant="text" onClick={resetDemo}>
            <RotateCcw size={16} /> Restaurar dados de demonstração
          </Button>
        )}
      </div>

      <Sheet open={sair} onClose={() => setSair(false)} title="Sair da conta">
        <div className="confirm">
          <LogOut size={36} className="red-icon" aria-hidden="true" />
          <h2 className="sheet-title">Sair da conta?</h2>
          <p className="muted">Seu progresso fica salvo. É só entrar de novo para continuar.</p>
          <Button block size="lg" onClick={logout}>
            Sair
          </Button>
          <Button block variant="ghost" onClick={() => setSair(false)}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Stat({ valor, rotulo, destaque }) {
  return (
    <HudCard size="sm" tone={destaque ? 'strong' : undefined} bodyClassName="hud__body stat-tile">
      <span className={`stat-tile__value ${destaque ? 'red-text' : ''}`}>{valor}</span>
      <span className="stat-tile__label">{rotulo}</span>
    </HudCard>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Crosshair, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Dificuldade, ErrorState, HudCard, SectionHead, SegmentBar, Skeleton } from '../components/ui';
import Badge from '../components/Badge';
import { formatarXp, nomeCurto, pad2, primeiroNome } from '../utils/rules';

export default function Home() {
  const { perfil, recarregarPerfil } = useAuth();

  // Perfil sempre fresco ao abrir a home (XP/conquistas podem ter mudado)
  useEffect(() => {
    recarregarPerfil().catch(() => {});
  }, [recarregarPerfil]);

  const { data, error, loading, reload } = useFetch(async () => {
    const [missoes, ranking, conquistas] = await Promise.all([
      api.missoes(),
      api.ranking({ limite: 3 }),
      api.conquistas(),
    ]);
    return { missoes, ranking: ranking.ranking, conquistas };
  }, []);

  if (!perfil || (loading && !data)) return <HomeSkeleton />;
  if (error && !data) return <div className="page-content"><ErrorState error={error} onRetry={reload} /></div>;

  const total = data.missoes.length;
  const feitas = data.missoes.filter((m) => m.concluida).length;
  const pct = total ? Math.round((feitas / total) * 100) : 0;
  // Próxima missão: a pendente mais fácil primeiro (curva de progressão suave)
  const ordem = { 'Fácil': 1, 'Médio': 2, 'Difícil': 3 };
  const proxima = data.missoes
    .filter((m) => !m.concluida)
    .sort((a, b) => ordem[a.dificuldade] - ordem[b.dificuldade])[0];
  const desbloqueadas = data.conquistas.conquistas.filter((c) => c.desbloqueada);

  return (
    <div className="page page-content stack-lg home">
      <section className="home__hello">
        <p className="eyebrow">Bem-vindo de volta</p>
        <h1 className="home__name">Olá, {primeiroNome(perfil.nome)}</h1>
        <p className="subtle">
          {perfil.curso}
          {perfil.role === 'estudante' && ` · ${perfil.semestre}º semestre`}
        </p>
      </section>

      {/* Painel principal de XP — "Números e destaques" */}
      <HudCard shape="diag" size="lg" tone="strong" label="XP total" bodyClassName="hud__body xp-hero">
        <div className="xp-hero__stripes tex-stripes tex-fade-left" aria-hidden="true" />
        <div className="xp-hero__main">
          <p className="xp-num xp-hero__value">{formatarXp(perfil.xp)}</p>
          <p className="xp-hero__caption">XP conquistados</p>
        </div>
        <div className="xp-hero__rank">
          <p className="xp-hero__rank-label">Ranking</p>
          <p className="xp-hero__rank-value">{perfil.posicao_ranking ? `#${perfil.posicao_ranking}` : '—'}</p>
        </div>
      </HudCard>

      <div className="progress-block">
        <div className="progress-block__head">
          <span className="eyebrow">Missões do campus</span>
          <span className="progress-block__count">
            <b>{feitas}</b>/{total} · {pct}%
          </span>
        </div>
        <SegmentBar value={feitas} max={total} segments={16} label="Missões concluídas" />
      </div>

      {/* Próxima missão — "Missão diária" da referência */}
      <section>
        <SectionHead title="Próxima missão" action={<Link to="/missoes" className="section-link">Todas <ChevronRight size={16} /></Link>} />
        {proxima ? (
          <HudCard as={Link} to={`/missoes/${proxima.missao_id}`} shape="all" bodyClassName="hud__body next-mission">
            <Crosshair className="next-mission__bg" size={120} strokeWidth={1.2} aria-hidden="true" />
            <p className="next-mission__label">Missão disponível</p>
            <h3 className="next-mission__title">{proxima.titulo}</h3>
            {proxima.descricao && <p className="next-mission__desc">{proxima.descricao}</p>}
            <div className="next-mission__foot">
              <Dificuldade valor={proxima.dificuldade} />
              <span className="next-mission__xp">+{proxima.xp} XP</span>
            </div>
          </HudCard>
        ) : (
          <HudCard shape="all" bodyClassName="hud__body next-mission next-mission--done">
            <Sparkles size={28} className="red-icon" aria-hidden="true" />
            <h3 className="next-mission__title">Todas as missões cumpridas!</h3>
            <p className="next-mission__desc">Novas missões aparecem aqui assim que forem publicadas.</p>
          </HudCard>
        )}
      </section>

      <div className="stat-row">
        <StatTile valor={feitas} rotulo="Missões" />
        <StatTile valor={`${desbloqueadas.length}/${data.conquistas.total}`} rotulo="Conquistas" />
        <StatTile valor={perfil.posicao_ranking ? `#${perfil.posicao_ranking}` : '—'} rotulo="Posição" />
      </div>

      <section>
        <SectionHead title="Conquistas" action={<Link to="/conquistas" className="section-link">Ver todas <ChevronRight size={16} /></Link>} />
        {desbloqueadas.length ? (
          <div className="chip-row badge-strip">
            {desbloqueadas.map((c) => (
              <Link key={c.conquista_id} to="/conquistas" className="badge-strip__item">
                <Badge conquista={c} size={60} />
                <span>{c.nome}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Conclua sua primeira missão para desbloquear a conquista “Primeiros Passos”.</p>
        )}
      </section>

      <section>
        <SectionHead title="Ranking" action={<Link to="/ranking" className="section-link">Completo <ChevronRight size={16} /></Link>} />
        <HudCard shape="all" bodyClassName="hud__body mini-rank">
          <p className="mini-rank__title">Top da Fatec</p>
          <ol>
            {data.ranking.map((u) => (
              <li key={u.usuario_id} className={u.usuario_id === perfil.usuario_id ? 'is-me' : ''}>
                <span className="mini-rank__pos">{pad2(u.posicao)}</span>
                <span className="mini-rank__name">{nomeCurto(u.nome)}</span>
                <span className="mini-rank__xp">{formatarXp(u.xp)} XP</span>
              </li>
            ))}
          </ol>
        </HudCard>
      </section>
    </div>
  );
}

function StatTile({ valor, rotulo }) {
  return (
    <HudCard size="sm" bodyClassName="hud__body stat-tile">
      <span className="stat-tile__value">{valor}</span>
      <span className="stat-tile__label">{rotulo}</span>
    </HudCard>
  );
}

function HomeSkeleton() {
  return (
    <div className="page-content stack-lg" aria-busy="true" aria-label="Carregando">
      <div className="stack" style={{ gap: 8 }}>
        <Skeleton h={12} w="40%" />
        <Skeleton h={34} w="65%" />
      </div>
      <Skeleton h={150} />
      <Skeleton h={30} />
      <Skeleton h={140} />
      <div className="stat-row">
        <Skeleton h={72} />
        <Skeleton h={72} />
        <Skeleton h={72} />
      </div>
    </div>
  );
}

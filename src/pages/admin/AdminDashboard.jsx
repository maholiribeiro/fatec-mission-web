import { Link } from 'react-router-dom';
import { ChevronRight, Crosshair, ListChecks, Target, Trophy, Users, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { useFetch } from '../../hooks/useFetch';
import { SubHeader } from '../../components/Layout';
import { ErrorState, HudCard, SectionHead, SegmentBar, Skeleton } from '../../components/ui';
import { formatarXp } from '../../utils/rules';

const pct = (n) => `${String(n).replace('.', ',')}%`;

export default function AdminDashboard() {
  const { data: d, error, loading, reload } = useFetch(() => api.admin.dashboard(), []);

  return (
    <>
      <SubHeader title="Painel admin" backTo="/perfil" />
      <div className="page page-content page-content--no-tabs stack-lg">
        {loading && !d ? (
          <div className="kpi-grid">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={96} />)}
          </div>
        ) : error && !d ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <>
            <HudCard shape="diag" size="lg" tone="strong" label="XP distribuído" bodyClassName="hud__body xp-hero">
              <div className="xp-hero__stripes tex-stripes tex-fade-left" aria-hidden="true" />
              <div className="xp-hero__main">
                <p className="xp-num xp-hero__value">{formatarXp(d.xp.distribuido)}</p>
                <p className="xp-hero__caption">
                  Saldo {formatarXp(d.xp.saldo)} · penalidades {formatarXp(d.xp.penalidades)}
                </p>
              </div>
            </HudCard>

            <div className="kpi-grid">
              <Kpi icon={Users} valor={d.usuarios.estudantes} rotulo="Estudantes" extra={`${d.usuarios.total} usuários`} />
              <Kpi icon={Crosshair} valor={d.missoes.ativas} rotulo="Missões ativas" extra={`${d.missoes.inativas} inativas`} />
              <Kpi icon={Target} valor={pct(d.taxa_conclusao)} rotulo="Taxa de conclusão" barra={d.taxa_conclusao} />
              <Kpi icon={ListChecks} valor={pct(d.tentativas.taxa_acerto)} rotulo="Taxa de acerto" barra={d.tentativas.taxa_acerto} />
              <Kpi icon={Zap} valor={d.tentativas.total} rotulo="Tentativas" extra={`${d.tentativas.erros} com erro`} />
              <Kpi icon={Trophy} valor={d.conquistas_desbloqueadas} rotulo="Conquistas" extra="desbloqueadas" />
            </div>

            <section>
              <SectionHead title="Mais concluídas" />
              {d.missoes_mais_concluidas.length ? (
                <ol className="top-list">
                  {d.missoes_mais_concluidas.map((m) => (
                    <li key={m.missao_id}>
                      <div className="top-list__head">
                        <span>{m.titulo}</span>
                        <b>{m.conclusoes}</b>
                      </div>
                      <SegmentBar value={m.conclusoes} max={d.missoes_mais_concluidas[0].conclusoes} segments={20} size="sm" />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">Nenhuma missão concluída ainda.</p>
              )}
            </section>

            <HudCard as={Link} to="/admin/missoes" tone="strong" bodyClassName="hud__body admin-entry">
              <Crosshair size={26} className="red-icon" aria-hidden="true" />
              <span>
                <strong>Gerenciar missões</strong>
                <small>Criar, editar, ativar e desativar</small>
              </span>
              <ChevronRight size={20} aria-hidden="true" />
            </HudCard>
          </>
        )}
      </div>
    </>
  );
}

function Kpi({ icon: Icon, valor, rotulo, extra, barra }) {
  return (
    <HudCard size="sm" bodyClassName="hud__body kpi">
      <Icon size={18} className="red-icon" aria-hidden="true" />
      <span className="kpi__value">{valor}</span>
      <span className="kpi__label">{rotulo}</span>
      {barra !== undefined ? <SegmentBar value={barra} max={100} segments={10} size="sm" /> : <span className="kpi__extra">{extra}</span>}
    </HudCard>
  );
}

import { useState } from 'react';
import { Award } from 'lucide-react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import Badge from '../components/Badge';
import { EmptyState, ErrorState, HudCard, SegmentBar, Sheet, SkeletonList } from '../components/ui';
import { descreverRequisito, progressoRequisito } from '../utils/rules';

const dataCurta = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export default function Conquistas() {
  const { data, error, loading, reload } = useFetch(async () => {
    const [c, p] = await Promise.all([api.conquistas(), api.perfil()]);
    return { ...c, perfil: p };
  }, []);
  const [aberta, setAberta] = useState(null);

  // Desbloqueadas primeiro, depois as mais próximas de serem conquistadas
  const lista = data
    ? [...data.conquistas].sort((a, b) => {
        if (a.desbloqueada !== b.desbloqueada) return a.desbloqueada ? -1 : 1;
        const pa = progresso(a, data.perfil);
        const pb = progresso(b, data.perfil);
        return (pb ? pb.atual / pb.alvo : 0) - (pa ? pa.atual / pa.alvo : 0);
      })
    : [];

  return (
    <div className="page page-content stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Reconhecimento</p>
          <h1 className="page-title">Conquistas</h1>
        </div>
      </header>

      {loading && !data ? (
        <SkeletonList n={4} h={120} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data.total ? (
        <EmptyState icon={Award} title="Nenhuma conquista cadastrada" />
      ) : (
        <>
          <HudCard shape="diag" tone="strong" label="Coleção" bodyClassName="hud__body collection">
            <div className="collection__count">
              <span className="xp-num">{data.desbloqueadas}</span>
              <span className="collection__of">/ {data.total}</span>
            </div>
            <div className="collection__bar">
              <span className="collection__caption">Conquistas desbloqueadas</span>
              <SegmentBar value={data.desbloqueadas} max={data.total} segments={data.total <= 16 ? data.total : 16} size="lg" />
            </div>
          </HudCard>

          <ul className="badge-grid">
            {lista.map((c) => {
              const prog = progresso(c, data.perfil);
              return (
                <li key={c.conquista_id}>
                  <HudCard
                    as="button"
                    type="button"
                    size="sm"
                    tone={c.desbloqueada ? 'strong' : 'muted'}
                    className={`badge-card ${c.desbloqueada ? '' : 'is-locked'}`}
                    bodyClassName="hud__body badge-card__body"
                    onClick={() => setAberta(c)}
                    aria-label={`${c.nome}: ${c.desbloqueada ? 'desbloqueada' : 'bloqueada'}`}
                  >
                    <Badge conquista={c} desbloqueada={c.desbloqueada} size={60} />
                    <span className="badge-card__name">{c.nome}</span>
                    {c.desbloqueada ? (
                      <span className="badge-card__meta red-text">{dataCurta(c.data_desbloqueio)}</span>
                    ) : prog ? (
                      <span className="badge-card__progress">
                        <SegmentBar value={prog.atual} max={prog.alvo} segments={8} size="sm" />
                        <span className="badge-card__meta">
                          {prog.atual}/{prog.alvo}
                        </span>
                      </span>
                    ) : (
                      <span className="badge-card__meta">Bloqueada</span>
                    )}
                  </HudCard>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Sheet open={Boolean(aberta)} onClose={() => setAberta(null)} title={aberta?.nome}>
        {aberta && (
          <div className="badge-detail">
            <Badge conquista={aberta} desbloqueada={aberta.desbloqueada} size={112} />
            <p className="eyebrow">{aberta.desbloqueada ? 'Conquista desbloqueada' : 'Conquista bloqueada'}</p>
            <h2 className="sheet-title">{aberta.nome}</h2>
            {aberta.descricao && <p className="muted">{aberta.descricao}</p>}
            <div className="badge-detail__req">
              <span className="field__label">Requisito</span>
              <strong>{descreverRequisito(aberta.requisito)}</strong>
              {!aberta.desbloqueada && progresso(aberta, data.perfil) && (
                <SegmentBar
                  value={progresso(aberta, data.perfil).atual}
                  max={progresso(aberta, data.perfil).alvo}
                  segments={12}
                />
              )}
              {aberta.desbloqueada && <span className="red-text">Desbloqueada em {dataCurta(aberta.data_desbloqueio)}</span>}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function progresso(c, perfil) {
  return progressoRequisito(c.requisito, { xp: perfil.xp, missoes: perfil.missoes_concluidas });
}

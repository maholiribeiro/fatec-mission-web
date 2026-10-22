import { useMemo, useState } from 'react';
import { Crosshair, SearchX } from 'lucide-react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';
import MissionCard from '../components/MissionCard';
import { EmptyState, ErrorState, SegmentBar, SkeletonList } from '../components/ui';
import { DIFICULDADES, TIPOS } from '../utils/rules';

const ABAS = [
  { id: 'pendentes', label: 'Disponíveis' },
  { id: 'concluidas', label: 'Cumpridas' },
  { id: 'todas', label: 'Todas' },
];

export default function Missoes() {
  const [aba, setAba] = useState('pendentes');
  const [dificuldade, setDificuldade] = useState('');
  const [tipo, setTipo] = useState('');

  // Busca todas as ativas uma vez; filtros são aplicados no cliente (resposta instantânea)
  const { data, error, loading, reload } = useFetch(() => api.missoes(), []);

  const lista = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (m) =>
        (aba === 'todas' || (aba === 'concluidas' ? m.concluida : !m.concluida)) &&
        (!dificuldade || m.dificuldade === dificuldade) &&
        (!tipo || m.tipo === tipo)
    );
  }, [data, aba, dificuldade, tipo]);

  const feitas = data?.filter((m) => m.concluida).length ?? 0;
  const total = data?.length ?? 0;
  const toggle = (setter, atual) => (valor) => setter(atual === valor ? '' : valor);

  return (
    <div className="page page-content stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Central de operações</p>
          <h1 className="page-title">Missões</h1>
        </div>
        {data && (
          <div className="page-head__meta">
            <span className="display page-head__count">
              {feitas}<small>/{total}</small>
            </span>
            <SegmentBar value={feitas} max={total} segments={8} size="sm" label="Missões concluídas" />
          </div>
        )}
      </header>

      <div className="segmented" role="group" aria-label="Situação das missões">
        {ABAS.map((a) => (
          <button key={a.id} aria-pressed={aba === a.id} onClick={() => setAba(a.id)}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="chip-row" role="group" aria-label="Filtros">
        {DIFICULDADES.map((d) => (
          <button key={d} className="chip" aria-pressed={dificuldade === d} onClick={() => toggle(setDificuldade, dificuldade)(d)}>
            {d}
          </button>
        ))}
        <span className="chip-row__sep" aria-hidden="true" />
        {TIPOS.map((t) => (
          <button key={t} className="chip" aria-pressed={tipo === t} onClick={() => toggle(setTipo, tipo)(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <SkeletonList n={5} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : lista.length ? (
        <ul className="stack" aria-live="polite">
          {lista.map((m) => (
            <li key={m.missao_id}>
              <MissionCard missao={m} />
            </li>
          ))}
        </ul>
      ) : dificuldade || tipo ? (
        <EmptyState icon={SearchX} title="Nenhuma missão encontrada">
          Tente remover algum filtro.
        </EmptyState>
      ) : aba === 'concluidas' ? (
        <EmptyState icon={Crosshair} title="Nenhuma missão cumprida">
          Suas missões concluídas aparecem aqui.
        </EmptyState>
      ) : (
        <EmptyState icon={Crosshair} title="Tudo cumprido!">
          Você concluiu todas as missões disponíveis. Fique de olho nas próximas.
        </EmptyState>
      )}
    </div>
  );
}

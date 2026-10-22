import { useState } from 'react';
import { Crown, Trophy } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { EmptyState, ErrorState, SkeletonList } from '../components/ui';
import { formatarXp, iniciais, nomeCurto, pad2 } from '../utils/rules';

const LIMITE = 50;
// Ordem visual do pódio: 2º à esquerda, 1º no centro, 3º à direita
const SLOTS = [2, 1, 3];

export default function Ranking() {
  const { perfil } = useAuth();
  const [escopo, setEscopo] = useState('geral');
  const curso = escopo === 'curso' ? perfil?.curso : undefined;

  const { data, error, loading, reload } = useFetch(() => api.ranking({ curso, limite: LIMITE }), [curso]);

  const lista = data?.ranking ?? [];
  const podio = lista.slice(0, 3);
  const resto = lista.slice(3);
  const euNaLista = lista.some((u) => u.usuario_id === perfil?.usuario_id);
  const podeFiltrarCurso = perfil?.role === 'estudante';

  return (
    <div className="page page-content stack ranking">
      <header className="page-head">
        <div>
          <p className="eyebrow">Classificação por XP</p>
          <h1 className="page-title">Ranking</h1>
        </div>
        {data && <span className="subtle ranking__total">{data.total} estudantes</span>}
      </header>

      {podeFiltrarCurso && (
        <div className="segmented" role="group" aria-label="Escopo do ranking">
          <button aria-pressed={escopo === 'geral'} onClick={() => setEscopo('geral')}>
            Geral
          </button>
          <button aria-pressed={escopo === 'curso'} onClick={() => setEscopo('curso')}>
            Meu curso
          </button>
        </div>
      )}
      {escopo === 'curso' && <p className="subtle ranking__course">{perfil.curso}</p>}

      {loading && !data ? (
        <SkeletonList n={6} h={60} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !lista.length ? (
        <EmptyState icon={Trophy} title="Ranking vazio">
          Ninguém pontuou ainda. Seja o primeiro!
        </EmptyState>
      ) : (
        <>
          <ol className="podium" aria-label="Pódio">
            {[podio[1], podio[0], podio[2]].map((u, i) =>
              u ? (
                <li
                  key={u.usuario_id}
                  className={`podium__col podium__col--${SLOTS[i]} ${u.usuario_id === perfil?.usuario_id ? 'is-me' : ''}`}
                >
                  {SLOTS[i] === 1 && <Crown className="podium__crown" size={22} aria-hidden="true" />}
                  <span className={`avatar ${SLOTS[i] === 1 ? 'avatar--red' : ''}`}>{iniciais(u.nome)}</span>
                  <span className="podium__name">{nomeCurto(u.nome)}</span>
                  <span className="podium__xp">{formatarXp(u.xp)} XP</span>
                  <div className="podium__block">
                    <span className="podium__pos">{u.posicao}</span>
                  </div>
                </li>
              ) : (
                <li key={`vazio-${i}`} className="podium__col podium__col--empty" aria-hidden="true" />
              )
            )}
          </ol>

          {resto.length > 0 && (
            <ol className="rank-list">
              {resto.map((u) => (
                <RankRow key={u.usuario_id} u={u} eu={u.usuario_id === perfil?.usuario_id} />
              ))}
            </ol>
          )}

          {/* Posição do usuário quando ele não aparece na página atual */}
          {!euNaLista && perfil?.role === 'estudante' && escopo === 'geral' && perfil.posicao_ranking && (
            <div className="rank-me-sticky">
              <ol className="rank-list">
                <RankRow
                  u={{ posicao: perfil.posicao_ranking, nome: perfil.nome, curso: perfil.curso, xp: perfil.xp }}
                  eu
                />
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RankRow({ u, eu }) {
  return (
    <li className={`rank-row ${eu ? 'is-me' : ''}`} aria-current={eu ? 'true' : undefined}>
      <span className="rank-row__pos">{pad2(u.posicao)}</span>
      <span className="avatar">{iniciais(u.nome)}</span>
      <span className="rank-row__who">
        <span className="rank-row__name">
          {u.nome} {eu && <span className="tag tag--red">Você</span>}
        </span>
        <span className="rank-row__course">{u.curso}</span>
      </span>
      <span className="rank-row__xp">
        {formatarXp(u.xp)} <small>XP</small>
      </span>
    </li>
  );
}

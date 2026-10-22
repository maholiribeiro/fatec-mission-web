import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  ListChecks,
  Play,
  RotateCcw,
  Send,
  TriangleAlert,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { SubHeader, XpPill } from '../components/Layout';
import { Button, Dificuldade, EmptyState, ErrorState, HudCard, SegmentBar, Sheet, Skeleton } from '../components/ui';
import Badge from '../components/Badge';
import { formatarXp, pad2 } from '../utils/rules';

const LETRAS = 'ABCDEF';
const fmtDecimal = (n) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);

/**
 * Progresso salvo por aba (sessionStorage): se o estudante sair no meio do quiz,
 * volta para a mesma pergunta com as respostas já marcadas.
 */
const progresso = {
  chave: (id) => `fm_quiz_${id}`,
  ler(id) {
    try {
      return JSON.parse(sessionStorage.getItem(this.chave(id))) || null;
    } catch {
      return null;
    }
  },
  salvar(id, dados) {
    try {
      sessionStorage.setItem(this.chave(id), JSON.stringify(dados));
    } catch {
      /* armazenamento indisponível */
    }
  },
  limpar(id) {
    try {
      sessionStorage.removeItem(this.chave(id));
    } catch {
      /* armazenamento indisponível */
    }
  },
};

export default function Quiz() {
  const { id } = useParams();
  const { data: quiz, error, loading, reload } = useFetch(() => api.quiz(id), [id]);

  const salvo = progresso.ler(id);
  const [fase, setFase] = useState('intro'); // intro | perguntas | resultado
  const [indice, setIndice] = useState(salvo?.indice ?? 0);
  const [respostas, setRespostas] = useState(salvo?.respostas ?? {}); // { pergunta_id: alternativa_id }
  const [resultado, setResultado] = useState(null);
  const [concluidoAgora, setConcluidoAgora] = useState(false);

  // Persiste o progresso enquanto responde
  useEffect(() => {
    if (fase === 'perguntas') progresso.salvar(id, { indice, respostas });
  }, [id, fase, indice, respostas]);

  const reiniciar = useCallback(() => {
    progresso.limpar(id);
    setRespostas({});
    setIndice(0);
    setResultado(null);
    setFase('perguntas');
  }, [id]);

  if (loading && !quiz) {
    return (
      <>
        <SubHeader title="Quiz" />
        <div className="page-content page-content--no-tabs stack">
          <Skeleton h={170} />
          <Skeleton h={84} />
          <Skeleton h={140} />
        </div>
      </>
    );
  }

  if (error && !quiz) {
    return (
      <>
        <SubHeader title="Quiz" />
        <div className="page-content page-content--no-tabs">
          <ErrorState error={error} onRetry={error.status >= 500 || error.status === 0 ? reload : undefined} />
        </div>
      </>
    );
  }

  if (fase === 'resultado' && resultado) {
    return <Resultado quiz={quiz} resultado={resultado} respostas={respostas} onRetry={reiniciar} />;
  }

  if ((quiz.missao.concluida || concluidoAgora) && fase !== 'resultado') {
    return (
      <>
        <SubHeader title="Quiz" backTo={`/missoes/${id}`} />
        <div className="page page-content page-content--no-tabs">
          <EmptyState
            icon={CircleCheck}
            title="Quiz concluído"
            action={<Link to="/missoes" className="btn btn--primary btn--sm">Ver outras missões</Link>}
          >
            Você já completou “{quiz.missao.titulo}”. Cada quiz pode ser concluído uma única vez.
          </EmptyState>
        </div>
      </>
    );
  }

  if (fase === 'intro') {
    return (
      <Intro
        quiz={quiz}
        emAndamento={Object.keys(respostas).length > 0}
        onStart={() => setFase('perguntas')}
        onRestart={reiniciar}
      />
    );
  }

  return (
    <Perguntas
      quiz={quiz}
      indice={indice}
      setIndice={setIndice}
      respostas={respostas}
      setRespostas={setRespostas}
      onSair={() => setFase('intro')}
      onResultado={(r) => {
        progresso.limpar(id);
        setResultado(r);
        setFase('resultado');
      }}
      onJaConcluido={() => {
        progresso.limpar(id);
        setConcluidoAgora(true);
        setFase('intro');
      }}
    />
  );
}

// =====================================================================
// INTRO
// =====================================================================
function Intro({ quiz, emAndamento, onStart, onRestart }) {
  const { missao } = quiz;
  return (
    <>
      <SubHeader title="Quiz" right={<XpPill />} backTo={`/missoes/${missao.missao_id}`} />
      <div className="page page-content page-content--no-tabs mission-detail stack-lg">
        <section className="mission-hero">
          <div className="mission-hero__tex tex-dots tex-fade-left" aria-hidden="true" />
          <div className="mission-hero__target" aria-hidden="true">
            <ListChecks size={128} strokeWidth={1.1} />
          </div>
          <div className="mission-hero__tags">
            <Dificuldade valor={missao.dificuldade} />
            <span className="tag tag--red">
              <ListChecks size={12} aria-hidden="true" /> Quiz
            </span>
          </div>
          <h1 className="mission-hero__title">{missao.titulo}</h1>
        </section>

        <div className="quiz-stats">
          <HudCard size="sm" bodyClassName="hud__body stat-tile">
            <span className="stat-tile__value">{quiz.total_perguntas}</span>
            <span className="stat-tile__label">Perguntas</span>
          </HudCard>
          <HudCard size="sm" tone="strong" bodyClassName="hud__body stat-tile">
            <span className="stat-tile__value red-text">+{quiz.xp_total}</span>
            <span className="stat-tile__label">XP máximo</span>
          </HudCard>
          <HudCard size="sm" bodyClassName="hud__body stat-tile">
            <span className="stat-tile__value">{fmtDecimal(quiz.xp_por_pergunta)}</span>
            <span className="stat-tile__label">XP / acerto</span>
          </HudCard>
        </div>

        {missao.descricao && (
          <section>
            <h2 className="eyebrow">Briefing</h2>
            <p className="mission-detail__desc">{missao.descricao}</p>
          </section>
        )}

        <section>
          <h2 className="eyebrow">Como funciona</h2>
          <ol className="steps">
            <li>Responda as {quiz.total_perguntas} perguntas escolhendo uma alternativa em cada.</li>
            <li>
              Cada acerto vale <b>{fmtDecimal(quiz.xp_por_pergunta)} XP</b>: sua pontuação é proporcional aos acertos.
            </li>
            <li>Revise e envie. Depois de enviar, não dá para alterar as respostas.</li>
          </ol>
          <p className="mission-detail__rule">
            <TriangleAlert size={14} aria-hidden="true" />
            Com pelo menos 1 acerto o quiz é concluído. Sem nenhum acerto, você perde {Math.abs(missao.penalidade)} XP e
            pode tentar de novo.
          </p>
        </section>
      </div>

      <div className="action-bar">
        <Button block size="lg" onClick={onStart}>
          <Play size={18} /> {emAndamento ? 'Continuar quiz' : 'Começar quiz'}
        </Button>
        {emAndamento && (
          <Button variant="text" onClick={onRestart}>
            <RotateCcw size={16} /> Recomeçar do zero
          </Button>
        )}
      </div>
    </>
  );
}

// =====================================================================
// PERGUNTAS
// =====================================================================
function Perguntas({ quiz, indice, setIndice, respostas, setRespostas, onSair, onResultado, onJaConcluido }) {
  const { atualizarXp, recarregarPerfil } = useAuth();
  const toast = useToast();
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const total = quiz.perguntas.length;
  const atual = Math.min(indice, total - 1);
  const pergunta = quiz.perguntas[atual];
  const escolhida = respostas[pergunta.pergunta_id];
  const respondidas = quiz.perguntas.filter((p) => respostas[p.pergunta_id]).length;
  const ultima = atual === total - 1;

  const escolher = (alternativaId) => {
    setRespostas((r) => ({ ...r, [pergunta.pergunta_id]: alternativaId }));
    navigator.vibrate?.(15);
  };

  const avancar = () => {
    if (ultima) setConfirmar(true);
    else setIndice(atual + 1);
  };

  /** Teclado: A–F / 1–6 escolhem, Enter avança (útil também em desktop). */
  useEffect(() => {
    const onKey = (e) => {
      if (confirmar || e.target.closest?.('input, textarea')) return;
      const k = e.key.toUpperCase();
      const pos = LETRAS.indexOf(k) >= 0 ? LETRAS.indexOf(k) : Number(k) - 1;
      if (pos >= 0 && pos < pergunta.alternativas.length && k.length === 1) {
        escolher(pergunta.alternativas[pos].alternativa_id);
      } else if (e.key === 'Enter' && escolhida) {
        avancar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function enviar() {
    setEnviando(true);
    try {
      const lista = quiz.perguntas.map((p) => ({ pergunta_id: p.pergunta_id, alternativa_id: respostas[p.pergunta_id] }));
      const r = await api.responderQuiz(quiz.missao.missao_id, lista);
      atualizarXp(r.xp_total);
      navigator.vibrate?.(r.historico.resultado === 'sucesso' ? [40, 60, 40] : 120);
      recarregarPerfil().catch(() => {});
      onResultado(r);
    } catch (e) {
      setConfirmar(false);
      toast.erro(e.message);
      if (e.status === 409) onJaConcluido();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <SubHeader
        title={quiz.missao.titulo}
        right={
          <span className="quiz-counter" aria-label={`Pergunta ${atual + 1} de ${total}`}>
            {pad2(atual + 1)}<small>/{pad2(total)}</small>
          </span>
        }
        onBack={onSair}
      />

      <div className="page-content page-content--no-tabs quiz">
        <div className="quiz__progress">
          <SegmentBar value={atual + 1} max={total} segments={total} label="Progresso do quiz" />
          <div className="quiz__progress-meta">
            <span>{respondidas} de {total} respondidas</span>
            <span className="red-text">+{fmtDecimal(quiz.xp_por_pergunta)} XP por acerto</span>
          </div>
        </div>

        {/* key reinicia a animação de entrada a cada pergunta */}
        <section key={pergunta.pergunta_id} className="quiz__question page" aria-labelledby="enunciado">
          <p className="eyebrow">Pergunta {pad2(atual + 1)}</p>
          <h2 id="enunciado" className="quiz__statement">{pergunta.enunciado}</h2>

          <div className="quiz__options" role="radiogroup" aria-labelledby="enunciado">
            {pergunta.alternativas.map((a, i) => {
              const marcada = escolhida === a.alternativa_id;
              return (
                <button
                  key={a.alternativa_id}
                  type="button"
                  role="radio"
                  aria-checked={marcada}
                  className={`quiz-option ${marcada ? 'is-selected' : ''}`}
                  onClick={() => escolher(a.alternativa_id)}
                >
                  <span className="quiz-option__letter" aria-hidden="true">{LETRAS[i]}</span>
                  <span className="quiz-option__text">{a.texto}</span>
                  <span className="quiz-option__check" aria-hidden="true">
                    {marcada && <Check size={16} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Atalhos para revisar qualquer pergunta */}
        <nav className="quiz__nav" aria-label="Ir para a pergunta">
          {quiz.perguntas.map((p, i) => (
            <button
              key={p.pergunta_id}
              type="button"
              className={`quiz__dot ${i === atual ? 'is-current' : ''} ${respostas[p.pergunta_id] ? 'is-answered' : ''}`}
              onClick={() => setIndice(i)}
              aria-label={`Pergunta ${i + 1}${respostas[p.pergunta_id] ? ', respondida' : ''}`}
              aria-current={i === atual ? 'step' : undefined}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </div>

      <div className="action-bar action-bar--split">
        <Button variant="ghost" size="lg" onClick={() => setIndice(atual - 1)} disabled={atual === 0} aria-label="Pergunta anterior">
          <ArrowLeft size={18} />
        </Button>
        <Button size="lg" onClick={avancar} disabled={!escolhida}>
          {ultima ? (
            <>
              Finalizar <Send size={18} />
            </>
          ) : (
            <>
              Próxima <ArrowRight size={18} />
            </>
          )}
        </Button>
      </div>

      <Sheet open={confirmar} onClose={() => !enviando && setConfirmar(false)} title="Enviar respostas">
        <div className="confirm">
          <Send size={36} className="red-icon" aria-hidden="true" />
          <h2 className="sheet-title">Enviar respostas?</h2>
          {respondidas < total ? (
            <p className="form-alert" role="alert">
              Faltam {total - respondidas} pergunta(s). Responda todas antes de enviar.
            </p>
          ) : (
            <p className="muted">
              Você respondeu as {total} perguntas. Depois de enviar, as respostas não podem ser alteradas.
            </p>
          )}
          <Button block size="lg" loading={enviando} disabled={respondidas < total} onClick={enviar}>
            Enviar e ver pontuação
          </Button>
          <Button
            block
            variant="ghost"
            disabled={enviando}
            onClick={() => {
              setConfirmar(false);
              const pendente = quiz.perguntas.findIndex((p) => !respostas[p.pergunta_id]);
              if (pendente >= 0) setIndice(pendente);
            }}
          >
            Revisar respostas
          </Button>
        </div>
      </Sheet>
    </>
  );
}

// =====================================================================
// RESULTADO
// =====================================================================
function Resultado({ quiz, resultado, respostas, onRetry }) {
  const navigate = useNavigate();
  const { pontuacao, correcao, historico, conquistas_desbloqueadas: novas = [] } = resultado;
  const sucesso = historico.resultado === 'sucesso';
  const porId = new Map(quiz.perguntas.map((p) => [p.pergunta_id, p]));

  return (
    <>
      <SubHeader title="Resultado" right={<XpPill />} backTo="/missoes" />
      <div className="page page-content page-content--no-tabs quiz-result stack-lg">
        <section className={`quiz-score ${sucesso ? '' : 'quiz-score--fail'}`}>
          <div className="quiz-score__tex tex-rings" aria-hidden="true" />
          <p className="eyebrow">{sucesso ? 'Missão cumprida' : 'Tentativa registrada'}</p>
          <p className="quiz-score__hits" aria-label={`${pontuacao.acertos} de ${pontuacao.total} acertos`}>
            {pontuacao.acertos}<span>/{pontuacao.total}</span>
          </p>
          <p className="quiz-score__label">
            acertos · {fmtDecimal(pontuacao.percentual)}%
          </p>
          <SegmentBar value={pontuacao.acertos} max={pontuacao.total} segments={pontuacao.total} size="lg" label="Acertos" />
          <p className={`quiz-score__xp ${sucesso ? 'xp-num' : ''}`}>
            {historico.xp_variacao > 0 ? `+${historico.xp_variacao}` : historico.xp_variacao}
            <small>XP</small>
          </p>
          <p className="muted">
            {sucesso
              ? `${pontuacao.acertos} × ${fmtDecimal(pontuacao.xp_por_pergunta)} XP por acerto. Seu total agora é ${formatarXp(resultado.xp_total)} XP.`
              : `Nenhum acerto: penalidade aplicada. Seu total agora é ${formatarXp(resultado.xp_total)} XP.`}
          </p>
        </section>

        {novas.length > 0 && (
          <section className="result__unlocks">
            <p className="eyebrow">
              {novas.length === 1 ? 'Nova conquista desbloqueada' : `${novas.length} conquistas desbloqueadas`}
            </p>
            <ul>
              {novas.map((c) => (
                <li key={c.conquista_id} className="unlock-row">
                  <Badge conquista={c} size={48} />
                  <div>
                    <strong>{c.nome}</strong>
                    <span>{c.descricao}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="section-title">Suas respostas</h2>
          <ol className="review-list">
            {correcao.map((c, i) => {
              const p = porId.get(c.pergunta_id);
              const alt = p?.alternativas.find((a) => a.alternativa_id === (c.alternativa_id ?? respostas[c.pergunta_id]));
              return (
                <li key={c.pergunta_id} className={`review-item ${c.acertou ? 'is-right' : 'is-wrong'}`}>
                  <span className="review-item__icon" aria-label={c.acertou ? 'Acertou' : 'Errou'}>
                    {c.acertou ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                  </span>
                  <div className="review-item__body">
                    <span className="review-item__n">Pergunta {pad2(i + 1)}</span>
                    <p className="review-item__q">{p?.enunciado}</p>
                    {alt && <p className="review-item__a">Sua resposta: <b>{alt.texto}</b></p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <div className="action-bar">
        {sucesso ? (
          <Button block size="lg" onClick={() => navigate('/missoes')}>
            Ver outras missões
          </Button>
        ) : (
          <>
            <Button block size="lg" onClick={onRetry}>
              <RotateCcw size={18} /> Tentar novamente
            </Button>
            <Button variant="text" onClick={() => navigate('/missoes')}>
              Voltar às missões
            </Button>
          </>
        )}
      </div>
    </>
  );
}

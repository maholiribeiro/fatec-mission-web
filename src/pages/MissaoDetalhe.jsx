import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleCheck, Crosshair, ListChecks, MinusCircle, Play, QrCode, TriangleAlert } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { SubHeader, XpPill } from '../components/Layout';
import { Button, Dificuldade, ErrorState, HudCard, Sheet, Skeleton } from '../components/ui';
import QrScanner from '../components/QrScanner';
import ResultSheet from '../components/ResultSheet';
import { ICONE_TIPO } from '../utils/icons';

export default function MissaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { atualizarXp, recarregarPerfil } = useAuth();
  const toast = useToast();
  const { data: missao, error, loading, reload, setData } = useFetch(() => api.missao(id), [id]);

  const [scanner, setScanner] = useState(false);
  const [confirmarErro, setConfirmarErro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  /** Envia a tentativa; a API aplica XP, penalidade e conquistas. */
  const tentar = useCallback(
    async (dados) => {
      setEnviando(true);
      try {
        const r = await api.concluir(id, dados);
        atualizarXp(r.xp_total);
        if (r.historico.resultado === 'sucesso') setData((m) => ({ ...m, concluida: true }));
        setScanner(false);
        setConfirmarErro(false);
        setResultado(r);
        navigator.vibrate?.(r.historico.resultado === 'sucesso' ? [40, 60, 40] : 120);
        recarregarPerfil().catch(() => {});
      } catch (e) {
        setScanner(false);
        setConfirmarErro(false);
        toast.erro(e.message);
        if (e.status === 409) setData((m) => ({ ...m, concluida: true }));
      } finally {
        setEnviando(false);
      }
    },
    [id, atualizarXp, recarregarPerfil, setData, toast]
  );

  const lerQr = useCallback((codigo) => tentar({ qr_code: codigo }), [tentar]);

  if (loading && !missao) {
    return (
      <>
        <SubHeader title="Missão" />
        <div className="page-content page-content--no-tabs stack">
          <Skeleton h={180} />
          <Skeleton h={90} />
          <Skeleton h={120} />
        </div>
      </>
    );
  }
  if (error && !missao) {
    return (
      <>
        <SubHeader title="Missão" />
        <div className="page-content page-content--no-tabs">
          <ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} />
        </div>
      </>
    );
  }

  const Icone = ICONE_TIPO[missao.tipo] || Crosshair;
  const inativa = missao.status !== 'ativa';
  const quiz = Boolean(missao.quiz);

  return (
    <>
      <SubHeader title={missao.tipo} right={<XpPill />} />

      <div className="page page-content page-content--no-tabs mission-detail stack-lg">
        <section className="mission-hero">
          <div className="mission-hero__tex tex-grid tex-fade-left" aria-hidden="true" />
          <div className="mission-hero__target" aria-hidden="true">
            <Crosshair size={132} strokeWidth={1.1} />
          </div>
          <div className="mission-hero__tags">
            <Dificuldade valor={missao.dificuldade} />
            <span className="tag">
              <Icone size={12} aria-hidden="true" /> {missao.tipo}
            </span>
            {quiz && (
              <span className="tag tag--red">
                <ListChecks size={12} aria-hidden="true" /> Quiz
              </span>
            )}
            {missao.possui_qr_code && (
              <span className="tag">
                <QrCode size={12} aria-hidden="true" /> QR Code
              </span>
            )}
          </div>
          <h1 className="mission-hero__title">{missao.titulo}</h1>
          {missao.concluida && (
            <p className="mission-hero__done">
              <CircleCheck size={18} aria-hidden="true" /> Missão cumprida
            </p>
          )}
        </section>

        <div className="reward-grid">
          <HudCard shape="tr" tone="strong" bodyClassName="hud__body reward">
            <span className="reward__label">{quiz ? 'Recompensa máxima' : 'Recompensa'}</span>
            <span className="xp-num reward__value">+{missao.xp}</span>
            <span className="reward__unit">{quiz ? 'XP com 100% de acertos' : 'XP'}</span>
          </HudCard>
          <HudCard shape="tr" tone="muted" bodyClassName="hud__body reward reward--penalty">
            <span className="reward__label">{quiz ? 'Penalidade sem acertos' : 'Penalidade por erro'}</span>
            <span className="reward__value">{missao.penalidade}</span>
            <span className="reward__unit">XP</span>
          </HudCard>
        </div>

        {missao.descricao && (
          <section>
            <h2 className="eyebrow">Briefing</h2>
            <p className="mission-detail__desc">{missao.descricao}</p>
          </section>
        )}

        <section>
          <h2 className="eyebrow">Como concluir</h2>
          <ol className="steps">
            {quiz ? (
              <>
                <li>Toque em <b>Iniciar quiz</b>.</li>
                <li>Responda todas as perguntas: cada acerto vale uma parte do XP.</li>
                <li>Envie as respostas e veja sua pontuação na hora.</li>
              </>
            ) : missao.possui_qr_code ? (
              <>
                <li>Vá até o local indicado no briefing.</li>
                <li>Encontre o QR Code da missão.</li>
                <li>Toque em <b>Escanear QR Code</b> e aponte a câmera.</li>
              </>
            ) : (
              <>
                <li>Realize a atividade descrita no briefing.</li>
                <li>Quando terminar, toque em <b>Concluí a missão</b>.</li>
              </>
            )}
          </ol>
          <p className="mission-detail__rule">
            <TriangleAlert size={14} aria-hidden="true" />
            {quiz
              ? ` A pontuação é proporcional aos acertos. Sem nenhum acerto, você perde ${Math.abs(missao.penalidade)} XP e pode tentar de novo.`
              : ` Cada erro custa ${Math.abs(missao.penalidade)} XP. Só é possível cumprir cada missão uma vez.`}
          </p>
        </section>
      </div>

      {/* Ações fixas no rodapé, ao alcance do polegar */}
      <div className="action-bar">
        {missao.concluida ? (
          <Button block size="lg" disabled>
            <CircleCheck size={20} /> Missão cumprida
          </Button>
        ) : inativa ? (
          <Button block size="lg" disabled>
            Missão indisponível
          </Button>
        ) : quiz ? (
          <Button block size="lg" onClick={() => navigate(`/missoes/${missao.missao_id}/quiz`)}>
            <Play size={20} /> Iniciar quiz
          </Button>
        ) : missao.possui_qr_code ? (
          <Button block size="lg" onClick={() => setScanner(true)}>
            <QrCode size={20} /> Escanear QR Code
          </Button>
        ) : (
          <>
            <Button block size="lg" loading={enviando} onClick={() => tentar({ resultado: 'sucesso' })}>
              <CircleCheck size={20} /> Concluí a missão
            </Button>
            <Button variant="text" onClick={() => setConfirmarErro(true)} disabled={enviando}>
              Não consegui concluir
            </Button>
          </>
        )}
      </div>

      <Sheet open={scanner} onClose={() => !enviando && setScanner(false)} title="Escanear QR Code">
        <p className="eyebrow">Validação</p>
        <h2 className="sheet-title">Escanear QR Code</h2>
        {scanner && <QrScanner onCode={lerQr} enviando={enviando} />}
      </Sheet>

      <Sheet open={confirmarErro} onClose={() => !enviando && setConfirmarErro(false)} title="Registrar tentativa sem sucesso">
        <div className="confirm">
          <MinusCircle size={40} className="red-icon" aria-hidden="true" />
          <h2 className="sheet-title">Registrar tentativa sem sucesso?</h2>
          <p className="muted">
            Isso aplica a penalidade de <b className="red-text">{missao.penalidade} XP</b>. Você poderá tentar de novo depois.
          </p>
          <Button block size="lg" loading={enviando} onClick={() => tentar({ resultado: 'erro' })}>
            Registrar ({missao.penalidade} XP)
          </Button>
          <Button block variant="ghost" onClick={() => setConfirmarErro(false)} disabled={enviando}>
            Cancelar
          </Button>
        </div>
      </Sheet>

      <ResultSheet
        resultado={resultado}
        onClose={() => setResultado(null)}
        onRetry={
          missao.possui_qr_code
            ? () => {
                setResultado(null);
                setScanner(true);
              }
            : undefined
        }
      />
    </>
  );
}

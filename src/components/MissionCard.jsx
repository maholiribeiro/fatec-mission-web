import { Link } from 'react-router-dom';
import { Check, ChevronRight, ListChecks, QrCode } from 'lucide-react';
import { Dificuldade, HudCard } from './ui';
import { ICONE_TIPO } from '../utils/icons';

/** Cartão de missão para listas. */
export default function MissionCard({ missao, to }) {
  const Icone = ICONE_TIPO[missao.tipo];
  const concluida = missao.concluida;
  const inativa = missao.status === 'inativa';

  return (
    <HudCard
      as={Link}
      to={to || `/missoes/${missao.missao_id}`}
      tone={concluida || inativa ? 'muted' : undefined}
      className={`mission-card ${concluida ? 'is-done' : ''}`}
      aria-label={`${missao.titulo}, ${missao.dificuldade}, ${concluida ? 'concluída' : `vale ${missao.xp} XP`}`}
    >
      <div className="mission-card__icon" aria-hidden="true">
        {concluida ? <Check size={22} strokeWidth={2.6} /> : Icone ? <Icone size={22} /> : null}
      </div>

      <div className="mission-card__main">
        <h3 className="mission-card__title">{missao.titulo}</h3>
        <div className="mission-card__meta">
          <Dificuldade valor={missao.dificuldade} />
          {missao.quiz ? (
            <span className="tag tag--soft" title="Quiz: perguntas respondidas no app">
              <ListChecks size={12} aria-hidden="true" /> Quiz
            </span>
          ) : (
            <span className="tag">{missao.tipo}</span>
          )}
          {missao.possui_qr_code && (
            <span className="tag" title="Requer QR Code">
              <QrCode size={12} aria-hidden="true" /> QR
            </span>
          )}
          {inativa && <span className="tag tag--soft">Inativa</span>}
        </div>
      </div>

      <div className="mission-card__reward">
        {concluida ? (
          <span className="mission-card__done">Cumprida</span>
        ) : (
          <>
            <span className="xp-num mission-card__xp">+{missao.xp}</span>
            <span className="mission-card__xp-label">{missao.quiz ? 'XP MÁX' : 'XP'}</span>
          </>
        )}
      </div>
      <ChevronRight size={18} className="mission-card__chevron" aria-hidden="true" />
    </HudCard>
  );
}

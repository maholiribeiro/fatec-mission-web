import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button, Sheet } from './ui';
import Badge from './Badge';
import { LogoIcon } from './Logo';
import { formatarXp } from '../utils/rules';

/** Feedback da tentativa: "Missão Cumprida" (+XP e conquistas) ou erro (penalidade). */
export default function ResultSheet({ resultado, onClose, onRetry }) {
  if (!resultado) return null;
  const sucesso = resultado.historico.resultado === 'sucesso';
  const variacao = resultado.historico.xp_variacao;
  const novas = resultado.conquistas_desbloqueadas || [];

  return (
    <Sheet open onClose={onClose} labelledBy="result-title">
      <div className={`result ${sucesso ? 'result--ok' : 'result--fail'}`}>
        <div className="result__glyph tex-rings" aria-hidden="true">
          {sucesso ? <LogoIcon size={84} title="" /> : <TriangleAlert size={56} />}
        </div>

        <p className="eyebrow">{sucesso ? 'Conquista' : 'Tentativa registrada'}</p>
        <h2 id="result-title" className="result__title">
          {sucesso ? 'Missão Cumprida' : 'Não foi dessa vez'}
        </h2>

        <p className="result__xp xp-num" aria-label={`${variacao} XP`}>
          {variacao > 0 ? `+${variacao}` : variacao}
          <small>XP</small>
        </p>
        <p className="muted">
          {sucesso
            ? `Seu total agora é ${formatarXp(resultado.xp_total)} XP.`
            : `Penalidade aplicada. Seu total agora é ${formatarXp(resultado.xp_total)} XP.`}
        </p>

        {novas.length > 0 && (
          <div className="result__unlocks">
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
          </div>
        )}

        <div className="result__actions">
          {!sucesso && onRetry && (
            <Button block size="lg" onClick={onRetry}>
              <RotateCcw size={18} /> Tentar novamente
            </Button>
          )}
          <Button block size="lg" variant={sucesso ? 'primary' : 'ghost'} onClick={onClose}>
            {sucesso ? 'Continuar' : 'Voltar'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

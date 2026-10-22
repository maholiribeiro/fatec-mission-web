import { Lock } from 'lucide-react';
import { iconeConquista } from '../utils/icons';

/**
 * Medalha de conquista: selo octogonal com ícone e "fitas" (lembra o ícone CONQUISTAS da identidade).
 */
export default function Badge({ conquista, desbloqueada = true, size = 64 }) {
  const Icone = iconeConquista(conquista?.requisito);
  return (
    <div
      className={`badge ${desbloqueada ? 'badge--on' : 'badge--off'}`}
      style={{ '--badge': `${size}px` }}
      aria-hidden="true"
    >
      <div className="badge__seal">
        <div className="badge__core">{desbloqueada ? <Icone size={size * 0.38} /> : <Lock size={size * 0.32} />}</div>
      </div>
      <div className="badge__ribbons">
        <i />
        <i />
      </div>
    </div>
  );
}

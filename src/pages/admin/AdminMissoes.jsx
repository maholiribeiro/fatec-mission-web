import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Pencil, Plus, QrCode } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { SubHeader } from '../../components/Layout';
import { Dificuldade, EmptyState, ErrorState, HudCard, SkeletonList } from '../../components/ui';

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'ativa', label: 'Ativas' },
  { id: 'inativa', label: 'Inativas' },
];

export default function AdminMissoes() {
  const toast = useToast();
  const [filtro, setFiltro] = useState('todas');
  const [alterando, setAlterando] = useState(null);
  const { data, error, loading, reload, setData } = useFetch(() => api.missoes({ status: 'todas' }), []);

  const lista = (data || []).filter((m) => filtro === 'todas' || m.status === filtro);

  async function alternar(m) {
    const novo = m.status === 'ativa' ? 'inativa' : 'ativa';
    setAlterando(m.missao_id);
    // Atualização otimista: a interface responde na hora e reverte se a API falhar
    setData((l) => l.map((x) => (x.missao_id === m.missao_id ? { ...x, status: novo } : x)));
    try {
      await api.admin.alterarStatus(m.missao_id, novo);
      toast.sucesso(`Missão ${novo === 'ativa' ? 'ativada' : 'desativada'}.`);
    } catch (e) {
      setData((l) => l.map((x) => (x.missao_id === m.missao_id ? { ...x, status: m.status } : x)));
      toast.erro(e.message);
    } finally {
      setAlterando(null);
    }
  }

  return (
    <>
      <SubHeader title="Missões" backTo="/admin" />
      <div className="page page-content page-content--no-tabs page-content--fab stack">
        <div className="segmented" role="group" aria-label="Filtrar por status">
          {FILTROS.map((f) => (
            <button key={f.id} aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && !data ? (
          <SkeletonList n={5} />
        ) : error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !lista.length ? (
          <EmptyState icon={Crosshair} title="Nenhuma missão" action={<Link className="btn btn--primary btn--sm" to="/admin/missoes/nova">Criar missão</Link>} />
        ) : (
          <ul className="stack">
            {lista.map((m) => (
              <li key={m.missao_id}>
                <HudCard tone={m.status === 'ativa' ? undefined : 'muted'} bodyClassName="hud__body admin-mission">
                  <div className="admin-mission__main">
                    <h3 className={m.status === 'ativa' ? '' : 'subtle'}>{m.titulo}</h3>
                    <div className="mission-card__meta">
                      <Dificuldade valor={m.dificuldade} />
                      <span className="tag">{m.tipo}</span>
                      <span className="tag tag--soft">+{m.xp} XP</span>
                    </div>
                    {m.qr_code && (
                      <p className="admin-mission__qr">
                        <QrCode size={13} aria-hidden="true" /> {m.qr_code}
                      </p>
                    )}
                  </div>
                  <div className="admin-mission__actions">
                    <button
                      className="switch"
                      role="switch"
                      aria-checked={m.status === 'ativa'}
                      aria-label={`${m.status === 'ativa' ? 'Desativar' : 'Ativar'} ${m.titulo}`}
                      disabled={alterando === m.missao_id}
                      onClick={() => alternar(m)}
                    />
                    <Link to={`/admin/missoes/${m.missao_id}`} className="icon-btn" aria-label={`Editar ${m.titulo}`}>
                      <Pencil size={18} />
                    </Link>
                  </div>
                </HudCard>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link to="/admin/missoes/nova" className="fab" aria-label="Nova missão">
        <Plus size={26} />
      </Link>
    </>
  );
}

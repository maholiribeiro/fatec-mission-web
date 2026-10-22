import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QrCode, Shuffle, Type } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { SubHeader } from '../../components/Layout';
import { Button, ErrorState, Field, HudCard, Skeleton } from '../../components/ui';
import { DIFICULDADES, PENALIDADE, TIPOS, XP } from '../../utils/rules';

const VAZIO = { titulo: '', descricao: '', dificuldade: 'Fácil', tipo: 'Tipo 1', status: 'ativa', qr_code: '' };

function gerarCodigo() {
  const bloco = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FATEC-${bloco}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

export default function MissaoForm() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(VAZIO);
  const [carregando, setCarregando] = useState(editando);
  const [erroCarga, setErroCarga] = useState(null);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    api
      .missao(id)
      .then((m) =>
        setForm({
          titulo: m.titulo,
          descricao: m.descricao || '',
          dificuldade: m.dificuldade,
          tipo: m.tipo,
          status: m.status,
          qr_code: m.qr_code || '',
        })
      )
      .catch(setErroCarga)
      .finally(() => setCarregando(false));
  }, [id, editando]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const campos = erro?.campos || {};

  async function salvar(e) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    const dados = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      dificuldade: form.dificuldade,
      tipo: form.tipo,
      status: form.status,
      qr_code: form.qr_code.trim() || null,
    };
    try {
      if (editando) await api.admin.editarMissao(id, dados);
      else await api.admin.criarMissao(dados);
      toast.sucesso(editando ? 'Missão atualizada.' : 'Missão criada.');
      navigate('/admin/missoes', { replace: true });
    } catch (err) {
      setErro(err);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <SubHeader title={editando ? 'Editar missão' : 'Nova missão'} backTo="/admin/missoes" />
      <div className="page page-content page-content--no-tabs">
        {carregando ? (
          <div className="stack">
            <Skeleton h={70} />
            <Skeleton h={130} />
            <Skeleton h={90} />
          </div>
        ) : erroCarga ? (
          <ErrorState error={erroCarga} />
        ) : (
          <form className="form" onSubmit={salvar} noValidate>
            {erro && !erro.detalhes.length && <p className="form-alert" role="alert">{erro.message}</p>}

            <Field label="Título" icon={Type} error={campos.titulo}>
              {(p) => <input {...p} className="input" value={form.titulo} onChange={set('titulo')} placeholder="Ex.: Visite o auditório" maxLength={150} />}
            </Field>

            <Field label="Descrição / briefing" error={campos.descricao}>
              {(p) => (
                <textarea {...p} className="input" value={form.descricao} onChange={set('descricao')} placeholder="Explique ao estudante o que fazer para cumprir a missão." />
              )}
            </Field>

            <fieldset className="field">
              <legend className="field__label">Dificuldade</legend>
              <div className="segmented">
                {DIFICULDADES.map((d) => (
                  <button key={d} type="button" aria-pressed={form.dificuldade === d} onClick={() => setForm((f) => ({ ...f, dificuldade: d }))}>
                    {d}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* O XP é regra de negócio: derivado da dificuldade, nunca digitado */}
            <HudCard size="sm" tone="strong" bodyClassName="hud__body xp-preview">
              <div>
                <span className="reward__label">Recompensa</span>
                <span className="xp-num">+{XP[form.dificuldade]} XP</span>
              </div>
              <div>
                <span className="reward__label">Penalidade</span>
                <span className="xp-preview__pen">{PENALIDADE[form.dificuldade]} XP</span>
              </div>
            </HudCard>

            <fieldset className="field">
              <legend className="field__label">Tipo</legend>
              <div className="segmented">
                {TIPOS.map((t) => (
                  <button key={t} type="button" aria-pressed={form.tipo === t} onClick={() => setForm((f) => ({ ...f, tipo: t }))}>
                    {t.replace('Tipo ', 'T')}
                  </button>
                ))}
              </div>
            </fieldset>

            <Field
              label="QR Code (opcional)"
              icon={QrCode}
              error={campos.qr_code}
              hint="Deixe vazio para missões sem QR Code. O código deve ser único."
              action={
                <button type="button" className="icon-btn" onClick={() => setForm((f) => ({ ...f, qr_code: gerarCodigo() }))} aria-label="Gerar código aleatório">
                  <Shuffle size={18} />
                </button>
              }
            >
              {(p) => (
                <input {...p} className="input" value={form.qr_code} onChange={(e) => setForm((f) => ({ ...f, qr_code: e.target.value.toUpperCase() }))} placeholder="FATEC-LOCAL-001" autoCapitalize="characters" maxLength={255} />
              )}
            </Field>

            <label className="toggle-row">
              <span>
                <strong>Missão ativa</strong>
                <small>Visível e disponível para os estudantes</small>
              </span>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={form.status === 'ativa'}
                onClick={() => setForm((f) => ({ ...f, status: f.status === 'ativa' ? 'inativa' : 'ativa' }))}
              />
            </label>

            <Button type="submit" block size="lg" loading={salvando}>
              {editando ? 'Salvar alterações' : 'Criar missão'}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}

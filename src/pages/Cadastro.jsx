import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, KeyRound, Mail, User } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogoIcon } from '../components/Logo';
import { Button, Field } from '../components/ui';

const CURSOS = [
  'Desenvolvimento de Software Multiplataforma',
  'Redes de Computadores',
  'Manutenção Industrial',
  'Automação Industrial',
  'Sistema Biomédicos',
  'Gestão Empresarial',
  'Gestão Financeira',
];

export default function Cadastro() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', senha: '', curso: '', semestre: '' });
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const campos = erro?.campos || {};

  async function cadastrar(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api.cadastrar({ ...form, semestre: Number(form.semestre) || undefined });
      await login(form.email.trim(), form.senha);
      toast.sucesso('Conta criada! Sua primeira missão te espera.');
      navigate('/', { replace: true });
    } catch (err) {
      setErro(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth auth--compact page">
      <div className="auth__bg" aria-hidden="true">
        <div className="auth__grid tex-grid tex-fade-bottom" />
        <div className="auth__glow" />
      </div>

      <div className="auth__hero auth__hero--row">
        <LogoIcon size={48} />
        <div>
          <p className="eyebrow">Novo recruta</p>
          <h1 className="auth__title">Criar conta</h1>
        </div>
      </div>

      <form className="auth__form form" onSubmit={cadastrar} noValidate>
        {erro && !erro.detalhes.length && (
          <p className="form-alert" role="alert">
            {erro.message}
          </p>
        )}

        <Field label="Nome completo" icon={User} error={campos.nome}>
          {(p) => <input {...p} className="input" autoComplete="name" placeholder="Maria Souza" value={form.nome} onChange={set('nome')} />}
        </Field>

        <Field label="E-mail" icon={Mail} error={campos.email}>
          {(p) => (
            <input {...p} className="input" type="email" inputMode="email" autoComplete="email" placeholder="voce@fatec.sp.gov.br" value={form.email} onChange={set('email')} />
          )}
        </Field>

        <Field
          label="Senha"
          icon={KeyRound}
          error={campos.senha}
          hint="Mínimo de 6 caracteres."
          action={
            <button type="button" className="icon-btn" onClick={() => setVerSenha((v) => !v)} aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
              {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        >
          {(p) => (
            <input {...p} className="input" type={verSenha ? 'text' : 'password'} autoComplete="new-password" placeholder="Crie uma senha" value={form.senha} onChange={set('senha')} />
          )}
        </Field>

        <Field label="Curso" icon={GraduationCap} error={campos.curso}>
          {(p) => (
            <>
              <input {...p} className="input" list="cursos" placeholder="Selecione ou digite" value={form.curso} onChange={set('curso')} />
              <datalist id="cursos">
                {CURSOS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}
        </Field>

        <fieldset className="field semestre-picker">
          <legend className="field__label">Semestre</legend>
          <div className="semestre-picker__grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                className="chip"
                aria-pressed={Number(form.semestre) === n}
                onClick={() => setForm((f) => ({ ...f, semestre: n }))}
              >
                {n}º
              </button>
            ))}
          </div>
          {campos.semestre && <p className="field__error">{campos.semestre}</p>}
        </fieldset>

        <Button type="submit" block size="lg" loading={enviando}>
          Começar jornada
        </Button>

        <p className="auth__switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}

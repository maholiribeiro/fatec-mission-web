import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USE_MOCK } from '../api/client';
import Logo from '../components/Logo';
import { Button, Field } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function entrar(e) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(form.email.trim(), form.senha);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setErro(err);
    } finally {
      setEnviando(false);
    }
  }

  const campos = erro?.campos || {};

  return (
    <div className="auth page">
      <div className="auth__bg" aria-hidden="true">
        <div className="auth__grid tex-grid tex-fade-bottom" />
        <div className="auth__glow" />
      </div>

      <div className="auth__hero">
        <Logo variant="stacked" size={76} />
        <p className="auth__tagline">
          Missões que conectam. <span>Conquistas que transformam.</span>
        </p>
      </div>

      <form className="auth__form form" onSubmit={entrar} noValidate>
        <h1 className="auth__title">Entrar</h1>

        {erro && !erro.detalhes.length && (
          <p className="form-alert" role="alert">
            {erro.message}
          </p>
        )}

        <Field label="E-mail institucional" icon={Mail} error={campos.email}>
          {(p) => (
            <input
              {...p}
              className="input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@fatec.sp.gov.br"
              value={form.email}
              onChange={set('email')}
              required
            />
          )}
        </Field>

        <Field
          label="Senha"
          icon={KeyRound}
          error={campos.senha}
          action={
            <button
              type="button"
              className="icon-btn"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={verSenha}
            >
              {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        >
          {(p) => (
            <input
              {...p}
              className="input"
              type={verSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={form.senha}
              onChange={set('senha')}
              required
            />
          )}
        </Field>

        <Button type="submit" block size="lg" loading={enviando} disabled={!form.email || !form.senha}>
          Entrar
        </Button>

        <p className="auth__switch">
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>

        {USE_MOCK && (
          <div className="auth__demo">
            <span className="demo-badge">MODO DEMO</span>
            <button type="button" onClick={() => setForm({ email: 'demo@fatec.sp.gov.br', senha: 'demo123' })}>
              Estudante: demo@fatec.sp.gov.br · demo123
            </button>
            <button type="button" onClick={() => setForm({ email: 'admin@fatec.sp.gov.br', senha: 'Admin@123' })}>
              Admin: admin@fatec.sp.gov.br · Admin@123
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

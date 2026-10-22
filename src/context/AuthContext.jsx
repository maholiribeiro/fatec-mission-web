import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

/**
 * Sessão do usuário: token JWT + perfil (GET /perfil).
 * O perfil é recarregado ao abrir o app e após ações que mudam XP/conquistas.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.set(null);
    setToken(null);
    setPerfil(null);
  }, []);

  const recarregarPerfil = useCallback(async () => {
    const p = await api.perfil();
    setPerfil(p);
    return p;
  }, []);

  // Restaura a sessão salva
  useEffect(() => {
    if (!token) {
      setCarregando(false);
      return;
    }
    let ativo = true;
    setCarregando(true);
    api
      .perfil()
      .then((p) => ativo && setPerfil(p))
      .catch(() => ativo && logout())
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [token, logout]);

  // Qualquer 401 da API encerra a sessão
  useEffect(() => {
    window.addEventListener('fm:unauthorized', logout);
    return () => window.removeEventListener('fm:unauthorized', logout);
  }, [logout]);

  const login = useCallback(async (email, senha) => {
    const r = await api.login(email, senha);
    tokenStore.set(r.token);
    setToken(r.token);
    return r.usuario;
  }, []);

  /** Atualiza só o XP localmente (feedback imediato após concluir missão). */
  const atualizarXp = useCallback((xp) => {
    setPerfil((p) => (p ? { ...p, xp } : p));
  }, []);

  const value = useMemo(
    () => ({
      token,
      perfil,
      carregando,
      autenticado: Boolean(token),
      isAdmin: perfil?.role === 'administrador',
      login,
      logout,
      recarregarPerfil,
      atualizarXp,
    }),
    [token, perfil, carregando, login, logout, recarregarPerfil, atualizarXp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

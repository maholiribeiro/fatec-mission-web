/**
 * Cliente HTTP da API Fatec Mission.
 * - Guarda o JWT e envia "Authorization: Bearer <token>".
 * - Converte o erro padronizado da API ({ erro: { status, mensagem, detalhes } }) em ApiError.
 * - Com VITE_USE_MOCK=true, usa a API simulada (src/api/mock.js) no lugar da rede.
 */
const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const TOKEN_KEY = 'fm_token';

export class ApiError extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes || [];
  }

  /** Converte os detalhes de validação em { campo: mensagem } para exibir nos inputs. */
  get campos() {
    return Object.fromEntries(this.detalhes.map((d) => [d.campo, d.mensagem]));
  }
}

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* armazenamento indisponível (aba anônima etc.) */
    }
  },
};

function queryString(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function request(method, path, { body, query } = {}) {
  const token = tokenStore.get();
  let status;
  let data;

  if (USE_MOCK) {
    const { mockRequest } = await import('./mock.js');
    ({ status, data } = await mockRequest(method, path, { body, query, token }));
  } else {
    let res;
    try {
      res = await fetch(`${BASE_URL}${path}${queryString(query)}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
    }
    status = res.status;
    data = await res.json().catch(() => null);
  }

  if (status >= 200 && status < 300) return data;

  const erro = data?.erro || {};
  // Sessão expirada/inválida: avisa o AuthContext para deslogar.
  if (status === 401 && token && path !== '/login') {
    window.dispatchEvent(new Event('fm:unauthorized'));
  }
  throw new ApiError(status, erro.mensagem || `Erro inesperado (${status}).`, erro.detalhes);
}

export const api = {
  login: (email, senha) => request('POST', '/login', { body: { email, senha } }),
  cadastrar: (dados) => request('POST', '/usuarios', { body: dados }),
  perfil: () => request('GET', '/perfil'),

  missoes: (filtros) => request('GET', '/missoes', { query: filtros }),
  missao: (id) => request('GET', `/missoes/${id}`),
  concluir: (id, dados) => request('POST', `/missoes/${id}/concluir`, { body: dados }),
  quiz: (id) => request('GET', `/missoes/${id}/quiz`),
  responderQuiz: (id, respostas) => request('POST', `/missoes/${id}/quiz/respostas`, { body: { respostas } }),

  ranking: (filtros) => request('GET', '/ranking', { query: filtros }),
  conquistas: () => request('GET', '/conquistas'),

  admin: {
    dashboard: () => request('GET', '/admin/dashboard'),
    criarMissao: (dados) => request('POST', '/admin/missoes', { body: dados }),
    editarMissao: (id, dados) => request('PUT', `/admin/missoes/${id}`, { body: dados }),
    alterarStatus: (id, status) => request('PATCH', `/admin/missoes/${id}/status`, { body: { status } }),
  },
};

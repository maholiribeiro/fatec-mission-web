/**
 * Espelho das regras do back-end para exibir valores antes da resposta da API
 * (ex.: prévia de XP no formulário de missão). A API continua sendo a fonte da verdade.
 */
export const DIFICULDADES = ['Fácil', 'Médio', 'Difícil'];
export const TIPOS = ['Tipo 1', 'Tipo 2', 'Tipo 3', 'Tipo 4'];
/** Tipo de missão que é um quiz (a API também informa isso no campo `quiz` da missão). */
export const TIPO_QUIZ = 'Tipo 2';

export const XP = { 'Fácil': 75, 'Médio': 100, 'Difícil': 150 };
export const PENALIDADE = { 'Fácil': -15, 'Médio': -25, 'Difícil': -75 };

/** Nível visual da dificuldade (1 a 3), usado nos "pips". */
export const NIVEL = { 'Fácil': 1, 'Médio': 2, 'Difícil': 3 };

/** Texto legível para o requisito de uma conquista (formato "missoes:5", "xp:500"...). */
export function descreverRequisito(req) {
  if (!req) return 'Concedida pela coordenação';
  const p = req.split(':');
  const n = Number(p[p.length - 1]);
  switch (p[0]) {
    case 'missoes':
      return n === 1 ? 'Conclua 1 missão' : `Conclua ${n} missões`;
    case 'xp':
      return `Acumule ${formatarXp(n)} XP`;
    case 'dificuldade':
      return n === 1 ? `Conclua 1 missão ${p[1].toLowerCase()}` : `Conclua ${n} missões de nível ${p[1].toLowerCase()}`;
    case 'tipo':
      return n === 1 ? `Conclua 1 missão do ${p[1]}` : `Conclua ${n} missões do ${p[1]}`;
    default:
      return req;
  }
}

/** Progresso (0–1) do usuário em direção ao requisito, quando calculável no front. */
export function progressoRequisito(req, { xp = 0, missoes = [] } = {}) {
  if (!req) return null;
  const p = req.split(':');
  const alvo = Number(p[p.length - 1]);
  if (!alvo) return null;
  let atual;
  if (p[0] === 'missoes') atual = missoes.length;
  else if (p[0] === 'xp') atual = xp;
  else if (p[0] === 'dificuldade') atual = missoes.filter((m) => m.dificuldade === p[1]).length;
  else if (p[0] === 'tipo') atual = missoes.filter((m) => m.tipo === p[1]).length;
  else return null;
  return { atual: Math.max(0, Math.min(atual, alvo)), alvo };
}

export function formatarXp(n) {
  return new Intl.NumberFormat('pt-BR').format(n ?? 0);
}

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const [a, b] = [partes[0], partes.length > 1 ? partes[partes.length - 1] : ''];
  return (a[0] + (b[0] || '')).toUpperCase();
}

export function primeiroNome(nome = '') {
  return nome.trim().split(/\s+/)[0] || '';
}

/** "Lucas Martins" → "Lucas M." (como na referência do ranking) */
export function nomeCurto(nome = '') {
  const partes = nome.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1][0]}.` : partes[0];
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

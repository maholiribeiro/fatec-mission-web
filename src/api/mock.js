/**
 * API SIMULADA — usada apenas com VITE_USE_MOCK=true ("npm run dev:mock").
 * Reproduz os endpoints e as regras de negócio do back-end (XP, penalidades,
 * sucesso único por missão, QR Code, conquistas, ranking e dashboard) em memória,
 * persistindo no localStorage para sobreviver a recarregamentos.
 *
 * Contas de demonstração:
 *   estudante  demo@fatec.sp.gov.br  / demo123
 *   admin      admin@fatec.sp.gov.br / Admin@123
 */
import { XP, PENALIDADE, TIPO_QUIZ } from '../utils/rules.js';

// v2: inclui perguntas/alternativas de quiz (dados v1 antigos são descartados)
const DB_KEY = 'fm_mock_db_v2';
const LATENCIA = 350;

const MISSOES = [
  ['Conheça a Biblioteca', 'Vá até a biblioteca e leia o QR Code fixado no balcão de atendimento.', 'Fácil', 'Tipo 1', 'FATEC-BIBLIOTECA-001'],
  ['Visite a Secretaria Acadêmica', 'Encontre o QR Code no mural da secretaria acadêmica.', 'Fácil', 'Tipo 1', 'FATEC-SECRETARIA-001'],
  ['Explore o Laboratório de Informática', 'Localize o QR Code escondido no laboratório 3.', 'Médio', 'Tipo 1', 'FATEC-LAB3-001'],
  ['Quiz: Regimento da Fatec', 'Responda corretamente ao quiz sobre o regimento interno da unidade.', 'Médio', 'Tipo 2', null],
  ['Quiz: Lógica de Programação', 'Resolva os desafios de lógica propostos na plataforma.', 'Difícil', 'Tipo 2', null],
  ['Participe de uma Palestra', 'Leia o QR Code exibido ao final da palestra da semana.', 'Médio', 'Tipo 3', 'FATEC-PALESTRA-001'],
  ['Caça ao Tesouro no Campus', 'Siga as pistas espalhadas pelo campus até encontrar o QR Code final.', 'Difícil', 'Tipo 3', 'FATEC-TESOURO-001'],
  ['Desafio Virtual: Portfólio', 'Publique seu portfólio on-line e envie o link para validação.', 'Difícil', 'Tipo 4', null],
  ['Estude um tema do curso', 'Assista a uma aula extra da trilha do seu curso e conclua o resumo.', 'Fácil', 'Tipo 4', null],
];

const CONQUISTAS = [
  ['Primeiros Passos', 'Conclua sua primeira missão.', 'missoes:1'],
  ['Explorador', 'Conclua 5 missões.', 'missoes:5'],
  ['Veterano do Campus', 'Conclua 10 missões.', 'missoes:10'],
  ['Colecionador de XP', 'Acumule 500 de XP.', 'xp:500'],
  ['Mestre do XP', 'Acumule 1000 de XP.', 'xp:1000'],
  ['Destemido', 'Conclua uma missão difícil.', 'dificuldade:Difícil:1'],
  ['Caçador de Desafios', 'Conclua 3 missões difíceis.', 'dificuldade:Difícil:3'],
  ['Pé na Estrada', 'Conclua 2 missões do Tipo 1.', 'tipo:Tipo 1:2'],
];

// Mesmas perguntas do seed do back-end. Formato: [enunciado, [alternativas...]] — a 1ª é a correta
// (a ordem exibida é embaralhada na criação para o gabarito não ser sempre "A").
const PERGUNTAS = {
  'Quiz: Regimento da Fatec': [
    ['Qual instituição administra as Fatecs no estado de São Paulo?', ['Centro Paula Souza', 'Ministério da Educação', 'Universidade de São Paulo', 'Prefeitura de cada município']],
    ['O que significa a sigla FATEC?', ['Faculdade de Tecnologia', 'Fundação de Apoio Técnico', 'Faculdade Técnica Estadual de Ciências', 'Federação Acadêmica de Tecnologia']],
    ['Qual é a frequência mínima exigida para aprovação em uma disciplina?', ['75%', '50%', '60%', '90%']],
    ['Qual sistema acadêmico on-line os alunos usam para consultar notas e faltas?', ['SIGA', 'SISU', 'ENEM', 'FIES']],
  ],
  'Quiz: Lógica de Programação': [
    ['Qual é o valor de (verdadeiro E falso) OU verdadeiro?', ['Verdadeiro', 'Falso', 'Indefinido']],
    ['Quantas vezes o laço "para i de 0 até 9 passo 2" é executado?', ['5', '4', '9', '10']],
    ['Qual estrutura de dados segue o princípio LIFO (último a entrar, primeiro a sair)?', ['Pilha', 'Fila', 'Lista ligada', 'Árvore binária']],
    ['Qual é o resultado de 17 % 5 (resto da divisão inteira)?', ['2', '3', '3,4', '0']],
  ],
};

const ESTUDANTES = [
  ['Lucas Martins', 'Análise e Desenvolvimento de Sistemas', 5, 1520],
  ['Juliana Ribeiro', 'Gestão Empresarial', 4, 1380],
  ['Rafael Santos', 'Análise e Desenvolvimento de Sistemas', 6, 1210],
  ['Beatriz Costa', 'Ciência de Dados', 3, 990],
  ['Gabriel Alves', 'Logística', 2, 840],
  ['Mariana Lopes', 'Análise e Desenvolvimento de Sistemas', 4, 725],
  ['Pedro Henrique', 'Gestão da Tecnologia da Informação', 1, 610],
  ['Camila Freitas', 'Ciência de Dados', 2, 450],
  ['Thiago Nunes', 'Logística', 3, 300],
  ['Larissa Melo', 'Gestão Empresarial', 1, 175],
  ['Vinícius Rocha', 'Análise e Desenvolvimento de Sistemas', 2, 75],
];

function seed() {
  const usuarios = [
    { usuario_id: 1, nome: 'Administrador Fatec', email: 'admin@fatec.sp.gov.br', senha: 'Admin@123', curso: 'Administração do Sistema', semestre: 1, xp: 0, role: 'administrador' },
    { usuario_id: 2, nome: 'Maria Souza', email: 'demo@fatec.sp.gov.br', senha: 'demo123', curso: 'Análise e Desenvolvimento de Sistemas', semestre: 3, xp: 0, role: 'estudante' },
    ...ESTUDANTES.map(([nome, curso, semestre, xp], i) => ({
      usuario_id: i + 3,
      nome,
      email: `${nome.split(' ')[0].toLowerCase()}@fatec.sp.gov.br`,
      senha: 'senha123',
      curso,
      semestre,
      xp,
      role: 'estudante',
    })),
  ];
  const missoes = MISSOES.map(([titulo, descricao, dificuldade, tipo, qr_code], i) => ({
    missao_id: i + 1, titulo, descricao, dificuldade, tipo, xp: XP[dificuldade], status: 'ativa', qr_code,
  }));
  const conquistas = CONQUISTAS.map(([nome, descricao, requisito], i) => ({
    conquista_id: i + 1, nome, descricao, icone: null, requisito,
  }));

  const perguntas = [];
  const alternativas = [];
  for (const m of missoes) {
    (PERGUNTAS[m.titulo] || []).forEach(([enunciado, textos], i) => {
      const pergunta_id = perguntas.length + 1;
      perguntas.push({ pergunta_id, missao_id: m.missao_id, enunciado, ordem: i + 1 });
      // rotação determinística: a alternativa correta muda de posição a cada pergunta
      const ordenadas = textos.map((texto, j) => ({ texto, correta: j === 0 }));
      const giro = (i * 3 + 1) % ordenadas.length;
      [...ordenadas.slice(giro), ...ordenadas.slice(0, giro)].forEach((a, j) =>
        alternativas.push({ alternativa_id: alternativas.length + 1, pergunta_id, texto: a.texto, correta: a.correta, ordem: j + 1 })
      );
    });
  }

  const db = {
    usuarios, missoes, conquistas, perguntas, alternativas, historico: [], usuarioConquista: [],
    seq: { historico: 1, usuario: usuarios.length + 1, missao: missoes.length + 1 },
  };

  // A conta demo começa com algum progresso (os quizzes ficam livres para testar).
  registrar(db, 2, 1, 'sucesso');
  registrar(db, 2, 9, 'erro');
  registrar(db, 2, 9, 'sucesso');
  return db;
}

function carregar() {
  try {
    const salvo = localStorage.getItem(DB_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch { /* ignora */ }
  return seed();
}
let db = carregar();
function salvar() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* ignora */ }
}

// ---------------------------------------------------------------- regras

function parseRequisito(req) {
  if (!req) return null;
  const p = req.split(':');
  if ((p[0] === 'missoes' || p[0] === 'xp') && p.length === 2) return { tipo: p[0], n: +p[1] };
  if ((p[0] === 'dificuldade' || p[0] === 'tipo') && p.length === 3) return { tipo: p[0], alvo: p[1], n: +p[2] };
  return null;
}

function stats(db, uid) {
  const u = db.usuarios.find((x) => x.usuario_id === uid);
  const s = { xp: u.xp, missoes: 0, dificuldade: {}, tipo: {} };
  for (const h of db.historico) {
    if (h.usuario_id !== uid || h.resultado !== 'sucesso') continue;
    const m = db.missoes.find((x) => x.missao_id === h.missao_id);
    s.missoes++;
    s.dificuldade[m.dificuldade] = (s.dificuldade[m.dificuldade] || 0) + 1;
    s.tipo[m.tipo] = (s.tipo[m.tipo] || 0) + 1;
  }
  return s;
}

function atingiu(req, s) {
  const r = parseRequisito(req);
  if (!r) return false;
  if (r.tipo === 'missoes') return s.missoes >= r.n;
  if (r.tipo === 'xp') return s.xp >= r.n;
  return (s[r.tipo][r.alvo] || 0) >= r.n;
}

function registrar(db, uid, mid, resultado, xpVariacao) {
  const m = db.missoes.find((x) => x.missao_id === mid);
  const variacao = xpVariacao ?? (resultado === 'sucesso' ? XP[m.dificuldade] : PENALIDADE[m.dificuldade]);
  const h = { historico_id: db.seq.historico++, usuario_id: uid, missao_id: mid, resultado, xp_variacao: variacao };
  db.historico.push(h);
  const u = db.usuarios.find((x) => x.usuario_id === uid);
  u.xp += variacao;

  const novas = [];
  if (resultado === 'sucesso') {
    const s = stats(db, uid);
    for (const c of db.conquistas) {
      const ja = db.usuarioConquista.some((uc) => uc.usuario_id === uid && uc.conquista_id === c.conquista_id);
      if (!ja && atingiu(c.requisito, s)) {
        db.usuarioConquista.push({ usuario_id: uid, conquista_id: c.conquista_id, data_desbloqueio: new Date().toISOString() });
        novas.push(c);
      }
    }
  }
  return { h, u, novas };
}

const temSucesso = (uid, mid) =>
  db.historico.some((h) => h.usuario_id === uid && h.missao_id === mid && h.resultado === 'sucesso');

// ---------------------------------------------------------------- helpers HTTP

class MockError extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}
const falha = (status, mensagem, detalhes) => { throw new MockError(status, mensagem, detalhes); };
const publico = ({ senha, ...u }) => u;
const penal = (d) => PENALIDADE[d];

function formatarMissao(m, uid, admin) {
  const out = {
    missao_id: m.missao_id, titulo: m.titulo, descricao: m.descricao, dificuldade: m.dificuldade, tipo: m.tipo,
    xp: m.xp, penalidade: penal(m.dificuldade), status: m.status, possui_qr_code: !!m.qr_code,
    quiz: m.tipo === TIPO_QUIZ, concluida: temSucesso(uid, m.missao_id),
  };
  if (admin) out.qr_code = m.qr_code;
  return out;
}

function quizDaMissao(id) {
  const m = db.missoes.find((x) => x.missao_id === id);
  if (!m) falha(404, 'Missão não encontrada.');
  if (m.tipo !== TIPO_QUIZ) falha(400, `A missão "${m.titulo}" não é um quiz.`);
  return m;
}

/** Perguntas do quiz; o gabarito ("correta") só é incluído quando pedido (correção interna). */
function perguntasDoQuiz(missaoId, comGabarito) {
  return db.perguntas
    .filter((p) => p.missao_id === missaoId)
    .sort((a, b) => a.ordem - b.ordem)
    .map((p) => ({
      ...p,
      alternativas: db.alternativas
        .filter((a) => a.pergunta_id === p.pergunta_id)
        .sort((a, b) => a.ordem - b.ordem)
        .map(({ alternativa_id, texto, ordem, correta }) =>
          comGabarito ? { alternativa_id, texto, ordem, correta } : { alternativa_id, texto, ordem }),
    }));
}

function resumo(m, total) {
  return { total_perguntas: total, xp_total: XP[m.dificuldade], xp_por_pergunta: Math.round((XP[m.dificuldade] / total) * 100) / 100 };
}

function posicao(uid) {
  const u = db.usuarios.find((x) => x.usuario_id === uid);
  if (!u || u.role !== 'estudante') return null;
  return 1 + db.usuarios.filter((o) => o.role === 'estudante' && o.xp > u.xp).length;
}

function auth(token) {
  const uid = Number(String(token || '').replace('mock-', ''));
  const u = db.usuarios.find((x) => x.usuario_id === uid);
  if (!u) falha(401, 'Token de autenticação ausente.');
  return u;
}

function validarMissao(b) {
  const det = [];
  if (!b.titulo || b.titulo.trim().length < 3) det.push({ campo: 'titulo', mensagem: 'Informe um título com ao menos 3 caracteres' });
  if (!XP[b.dificuldade]) det.push({ campo: 'dificuldade', mensagem: 'Selecione a dificuldade' });
  if (!['Tipo 1', 'Tipo 2', 'Tipo 3', 'Tipo 4'].includes(b.tipo)) det.push({ campo: 'tipo', mensagem: 'Selecione o tipo' });
  if (det.length) falha(400, 'Dados inválidos.', det);
  const qr = b.qr_code ? b.qr_code.trim() : null;
  return qr;
}

// ---------------------------------------------------------------- rotas

const rotas = [
  ['POST', /^\/login$/, (_, { body }) => {
    const u = db.usuarios.find((x) => x.email === String(body.email || '').toLowerCase().trim());
    if (!u || u.senha !== body.senha) falha(401, 'E-mail ou senha inválidos.');
    return { token: `mock-${u.usuario_id}`, tipo: 'Bearer', expira_em: '8h', usuario: publico(u) };
  }],

  ['POST', /^\/usuarios$/, (_, { body }) => {
    const det = [];
    if (!body.nome || body.nome.trim().length < 2) det.push({ campo: 'nome', mensagem: 'Informe seu nome completo' });
    if (!/^\S+@\S+\.\S+$/.test(body.email || '')) det.push({ campo: 'email', mensagem: 'Informe um e-mail válido' });
    if (!body.senha || body.senha.length < 6) det.push({ campo: 'senha', mensagem: 'A senha deve ter no mínimo 6 caracteres' });
    if (!body.curso) det.push({ campo: 'curso', mensagem: 'Informe seu curso' });
    if (!(body.semestre >= 1 && body.semestre <= 12)) det.push({ campo: 'semestre', mensagem: 'Selecione o semestre' });
    if (det.length) falha(400, 'Dados inválidos.', det);
    const email = body.email.toLowerCase().trim();
    if (db.usuarios.some((x) => x.email === email)) falha(409, 'Já existe um usuário cadastrado com este e-mail.');
    const u = { usuario_id: db.seq.usuario++, nome: body.nome.trim(), email, senha: body.senha, curso: body.curso.trim(), semestre: +body.semestre, xp: 0, role: 'estudante' };
    db.usuarios.push(u);
    return { status: 201, data: publico(u) };
  }],

  ['GET', /^\/perfil$/, (_, { token }) => {
    const u = auth(token);
    const missoes = db.historico
      .filter((h) => h.usuario_id === u.usuario_id && h.resultado === 'sucesso')
      .map((h) => {
        const m = db.missoes.find((x) => x.missao_id === h.missao_id);
        return { missao_id: m.missao_id, titulo: m.titulo, dificuldade: m.dificuldade, tipo: m.tipo, xp_ganho: h.xp_variacao };
      });
    const conquistas = db.usuarioConquista
      .filter((uc) => uc.usuario_id === u.usuario_id)
      .map((uc) => ({ ...db.conquistas.find((c) => c.conquista_id === uc.conquista_id), desbloqueada: true, data_desbloqueio: uc.data_desbloqueio }));
    return { ...publico(u), posicao_ranking: posicao(u.usuario_id), total_missoes_concluidas: missoes.length, missoes_concluidas: missoes, conquistas };
  }],

  ['GET', /^\/missoes$/, (_, { token, query = {} }) => {
    const u = auth(token);
    const status = query.status || 'ativa';
    return db.missoes
      .filter((m) => (status === 'todas' || m.status === status)
        && (!query.tipo || m.tipo === query.tipo)
        && (!query.dificuldade || m.dificuldade === query.dificuldade))
      .map((m) => formatarMissao(m, u.usuario_id, u.role === 'administrador'));
  }],

  ['GET', /^\/missoes\/(\d+)$/, ([id], { token }) => {
    const u = auth(token);
    const m = db.missoes.find((x) => x.missao_id === +id);
    if (!m) falha(404, 'Missão não encontrada.');
    return formatarMissao(m, u.usuario_id, u.role === 'administrador');
  }],

  ['POST', /^\/missoes\/(\d+)\/concluir$/, ([id], { token, body = {} }) => {
    const u = auth(token);
    const m = db.missoes.find((x) => x.missao_id === +id);
    if (!m) falha(404, 'Missão não encontrada.');
    if (m.status !== 'ativa') falha(400, 'Esta missão está inativa.');
    if (m.tipo === TIPO_QUIZ) falha(400, `Esta missão é um quiz. Responda as perguntas em POST /missoes/${m.missao_id}/quiz/respostas.`);
    let resultado = body.resultado;
    if (body.qr_code !== undefined) {
      if (!m.qr_code) falha(400, 'Esta missão não utiliza QR Code. Informe o campo "resultado".');
      resultado = body.qr_code.trim() === m.qr_code ? 'sucesso' : 'erro';
    } else if (m.qr_code && resultado === 'sucesso') {
      falha(400, 'Esta missão exige a leitura do QR Code para ser concluída.');
    }
    if (!['sucesso', 'erro'].includes(resultado)) falha(400, 'Dados inválidos.', [{ campo: 'resultado', mensagem: 'Informe o resultado' }]);
    if (resultado === 'sucesso' && temSucesso(u.usuario_id, m.missao_id)) falha(409, 'Você já concluiu esta missão com sucesso.');

    const { h, u: atualizado, novas } = registrar(db, u.usuario_id, m.missao_id, resultado);
    return {
      status: 201,
      data: {
        mensagem: resultado === 'sucesso' ? `Missão concluída com sucesso! +${h.xp_variacao} XP` : `Tentativa incorreta. ${h.xp_variacao} XP`,
        historico: h,
        xp_total: atualizado.xp,
        conquistas_desbloqueadas: novas,
      },
    };
  }],

  // ------------------------------------------------------------ quiz
  ['GET', /^\/missoes\/(\d+)\/quiz$/, ([id], { token }) => {
    const u = auth(token);
    const m = quizDaMissao(+id);
    if (m.status !== 'ativa' && u.role !== 'administrador') falha(400, 'Esta missão está inativa.');
    const perguntas = perguntasDoQuiz(m.missao_id, false);
    if (!perguntas.length) falha(400, 'Este quiz ainda não possui perguntas.');
    return { missao: formatarMissao(m, u.usuario_id, u.role === 'administrador'), ...resumo(m, perguntas.length), perguntas };
  }],

  ['POST', /^\/missoes\/(\d+)\/quiz\/respostas$/, ([id], { token, body = {} }) => {
    const u = auth(token);
    const m = quizDaMissao(+id);
    if (m.status !== 'ativa') falha(400, 'Esta missão está inativa.');
    if (temSucesso(u.usuario_id, m.missao_id)) falha(409, 'Você já concluiu este quiz.');

    const perguntas = perguntasDoQuiz(m.missao_id, true);
    const respostas = Array.isArray(body.respostas) ? body.respostas : [];
    const escolhida = new Map(respostas.map((r) => [r.pergunta_id, r.alternativa_id]));
    const faltando = perguntas.filter((p) => !p.alternativas.some((a) => a.alternativa_id === escolhida.get(p.pergunta_id)));
    if (faltando.length || respostas.length !== perguntas.length) {
      falha(400, 'Respostas inválidas.', [{ campo: 'respostas', mensagem: `Responda todas as perguntas. Faltando: ${faltando.map((p) => p.pergunta_id).join(', ')}.` }]);
    }

    const correcao = perguntas.map((p) => ({
      pergunta_id: p.pergunta_id,
      alternativa_id: escolhida.get(p.pergunta_id),
      acertou: p.alternativas.some((a) => a.correta && a.alternativa_id === escolhida.get(p.pergunta_id)),
    }));
    const acertos = correcao.filter((c) => c.acertou).length;
    const xpPorPergunta = XP[m.dificuldade] / perguntas.length;
    const pontuacao = {
      acertos,
      total: perguntas.length,
      percentual: Math.round((acertos / perguntas.length) * 10000) / 100,
      xp_por_pergunta: Math.round(xpPorPergunta * 100) / 100,
      xp_obtido: Math.round(acertos * xpPorPergunta),
    };
    const resultado = acertos > 0 ? 'sucesso' : 'erro';
    const { h, u: atualizado, novas } = registrar(db, u.usuario_id, m.missao_id, resultado,
      resultado === 'sucesso' ? pontuacao.xp_obtido : PENALIDADE[m.dificuldade]);

    return {
      status: 201,
      data: {
        mensagem: resultado === 'sucesso'
          ? `Quiz concluído! ${acertos} de ${perguntas.length} acertos: +${h.xp_variacao} XP`
          : `Nenhuma resposta correta. ${h.xp_variacao} XP — tente novamente.`,
        pontuacao,
        correcao,
        historico: h,
        xp_total: atualizado.xp,
        conquistas_desbloqueadas: novas,
      },
    };
  }],

  ['GET', /^\/ranking$/, (_, { token, query = {} }) => {
    auth(token);
    const limite = +query.limite || 50;
    const pagina = +query.pagina || 1;
    const lista = db.usuarios
      .filter((u) => u.role === 'estudante' && (!query.curso || u.curso === query.curso))
      .sort((a, b) => b.xp - a.xp || a.nome.localeCompare(b.nome));
    const itens = lista.slice((pagina - 1) * limite, pagina * limite).map((u) => ({
      posicao: 1 + lista.filter((o) => o.xp > u.xp).length,
      usuario_id: u.usuario_id, nome: u.nome, curso: u.curso, semestre: u.semestre, xp: u.xp,
    }));
    return { curso: query.curso || null, pagina, limite, total: lista.length, ranking: itens };
  }],

  ['GET', /^\/conquistas$/, (_, { token }) => {
    const u = auth(token);
    const conquistas = db.conquistas.map((c) => {
      const uc = db.usuarioConquista.find((x) => x.usuario_id === u.usuario_id && x.conquista_id === c.conquista_id);
      return { ...c, desbloqueada: !!uc, data_desbloqueio: uc ? uc.data_desbloqueio : null };
    });
    return { total: conquistas.length, desbloqueadas: conquistas.filter((c) => c.desbloqueada).length, conquistas };
  }],

  // ------------------------------------------------------------ admin
  ['GET', /^\/admin\/dashboard$/, () => {
    const est = db.usuarios.filter((u) => u.role === 'estudante');
    const ativas = db.missoes.filter((m) => m.status === 'ativa');
    const suc = db.historico.filter((h) => h.resultado === 'sucesso');
    const ganho = db.historico.filter((h) => h.xp_variacao > 0).reduce((s, h) => s + h.xp_variacao, 0);
    const perda = db.historico.filter((h) => h.xp_variacao < 0).reduce((s, h) => s + h.xp_variacao, 0);
    const concl = suc.filter((h) => ativas.some((m) => m.missao_id === h.missao_id)).length;
    const pct = (a, b) => (b ? Math.round((a / b) * 10000) / 100 : 0);
    const top = db.missoes
      .map((m) => ({ missao_id: m.missao_id, titulo: m.titulo, conclusoes: suc.filter((h) => h.missao_id === m.missao_id).length }))
      .filter((m) => m.conclusoes > 0)
      .sort((a, b) => b.conclusoes - a.conclusoes)
      .slice(0, 5);
    return {
      usuarios: { total: db.usuarios.length, estudantes: est.length, administradores: db.usuarios.length - est.length },
      missoes: { total: db.missoes.length, ativas: ativas.length, inativas: db.missoes.length - ativas.length },
      xp: { distribuido: ganho, penalidades: perda, saldo: ganho + perda },
      tentativas: { total: db.historico.length, sucessos: suc.length, erros: db.historico.length - suc.length, taxa_acerto: pct(suc.length, db.historico.length) },
      taxa_conclusao: pct(concl, est.length * ativas.length),
      conquistas_desbloqueadas: db.usuarioConquista.length,
      missoes_mais_concluidas: top,
    };
  }],

  ['POST', /^\/admin\/missoes$/, (_, { body }) => {
    const qr = validarMissao(body);
    if (qr && db.missoes.some((m) => m.qr_code === qr)) falha(409, 'Já existe uma missão com este QR Code.');
    const m = { missao_id: db.seq.missao++, titulo: body.titulo.trim(), descricao: body.descricao || null, dificuldade: body.dificuldade, tipo: body.tipo, xp: XP[body.dificuldade], status: body.status || 'ativa', qr_code: qr };
    db.missoes.push(m);
    return { status: 201, data: formatarMissao(m, 0, true) };
  }],

  ['PUT', /^\/admin\/missoes\/(\d+)$/, ([id], { body }) => {
    const m = db.missoes.find((x) => x.missao_id === +id);
    if (!m) falha(404, 'Missão não encontrada.');
    const qr = validarMissao(body);
    if (qr && db.missoes.some((x) => x.qr_code === qr && x.missao_id !== m.missao_id)) falha(409, 'Já existe uma missão com este QR Code.');
    Object.assign(m, {
      titulo: body.titulo.trim(),
      descricao: body.descricao !== undefined ? body.descricao || null : m.descricao,
      dificuldade: body.dificuldade,
      tipo: body.tipo,
      status: body.status || m.status,
      qr_code: body.qr_code !== undefined ? qr : m.qr_code,
      xp: XP[body.dificuldade],
    });
    return formatarMissao(m, 0, true);
  }],

  ['PATCH', /^\/admin\/missoes\/(\d+)\/status$/, ([id], { body }) => {
    const m = db.missoes.find((x) => x.missao_id === +id);
    if (!m) falha(404, 'Missão não encontrada.');
    if (!['ativa', 'inativa'].includes(body.status)) falha(400, 'Dados inválidos.', [{ campo: 'status', mensagem: 'Status inválido' }]);
    m.status = body.status;
    return formatarMissao(m, 0, true);
  }],
];

export async function mockRequest(method, path, ctx) {
  await new Promise((r) => setTimeout(r, LATENCIA));
  for (const [metodo, regex, handler] of rotas) {
    const match = method === metodo && path.match(regex);
    if (!match) continue;
    try {
      if (path.startsWith('/admin')) {
        const u = auth(ctx.token);
        if (u.role !== 'administrador') falha(403, 'Acesso restrito a administradores.');
      }
      const out = handler(match.slice(1), ctx);
      salvar();
      return out && out.status && out.data ? out : { status: 200, data: out };
    } catch (e) {
      if (e instanceof MockError) {
        return { status: e.status, data: { erro: { status: e.status, mensagem: e.message, detalhes: e.detalhes } } };
      }
      throw e;
    }
  }
  return { status: 404, data: { erro: { status: 404, mensagem: `Rota não encontrada: ${method} ${path}` } } };
}

/** Restaura os dados de demonstração. */
export function resetMock() {
  db = seed();
  salvar();
}

# Fatec Mission — Web (mobile)

Front-end **mobile-first** do Fatec Mission, feito em React. Ele segue a identidade visual do projeto e consome a [Fatec Mission API](../fatec-mission-api).

**Stack:** React 19 · Vite · React Router · lucide-react (ícones) · CSS puro com design tokens · fontes Oswald e Public Sans (self-hosted via @fontsource)

## Como rodar

```bash
npm install

# Opção A: com a API real (a fatec-mission-api precisa estar rodando em http://localhost:3000)
npm run dev

# Opção B: sem back-end, com a API simulada no navegador
npm run dev:mock
```

Acesse http://localhost:5173.

No **modo demo** (`dev:mock`), a tela de login mostra atalhos para duas contas:

| Perfil | E-mail | Senha |
|---|---|---|
| Estudante | `demo@fatec.sp.gov.br` | `demo123` |
| Administrador | `admin@fatec.sp.gov.br` | `Admin@123` |

A API simulada aplica as mesmas regras do back-end: XP, penalidades, sucesso único por missão, QR Code, quiz com pontuação proporcional, conquistas e ranking. Os dados ficam no `localStorage`. Para restaurá-los, use o botão **Restaurar dados de demonstração** na tela de Perfil.

Os códigos de QR das missões presenciais de exemplo são `FATEC-BIBLIOTECA-001`, `FATEC-SECRETARIA-001`, `FATEC-LAB3-001`, `FATEC-PALESTRA-001` e `FATEC-TESOURO-001`. Os quizzes de exemplo são "Quiz: Regimento da Fatec" (100 XP, 25 por acerto) e "Quiz: Lógica de Programação" (150 XP, 37,5 por acerto).

### Testar no celular (com câmera para o QR Code)
Os navegadores só liberam a câmera em páginas seguras: **HTTPS** ou `localhost`. Pelo IP da rede em `http://`, a câmera não fica disponível e o app pede a digitação do código. Para usar a câmera no celular, suba o front em HTTPS:

```bash
npm run dev:https         # com a API real
npm run dev:mock:https    # sem back-end
```

1. Com o celular na mesma rede Wi-Fi, abra o endereço **Network** com `https://` que aparece no terminal (ex.: `https://192.168.0.10:5173`).
2. O certificado é autoassinado, então o navegador vai mostrar um aviso. Toque em **Avançado → Continuar para o site** (no Safari: **Mostrar detalhes → visitar este site**).
3. Ao escanear, permita o acesso à câmera.

As chamadas passam pelo proxy `/api` do Vite, então não é preciso configurar o IP da API nem mexer em CORS.

A leitura do QR usa o `BarcodeDetector` nativo quando o navegador tem (Chrome/Edge no Android). Nos demais (Safari/iOS, Firefox), usa a biblioteca **jsQR**, carregada só quando o leitor abre. Se a câmera não puder ser usada, a tela explica o motivo (sem HTTPS, permissão negada, câmera em uso...) e oferece a digitação do código.

### Variáveis (`.env`, veja `.env.example`)
| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api` | Base das chamadas (via proxy do Vite) |
| `API_PROXY_TARGET` | `http://localhost:3000` | Para onde o proxy encaminha |
| `VITE_USE_MOCK` | `false` | `true` usa a API simulada |

### Build de produção
```bash
npm run build     # gera dist/
npm run preview   # serve o build em http://localhost:4173 (com o mesmo proxy)
```

## Telas

| Tela | Rota | Destaques |
|---|---|---|
| Login / Cadastro | `/login`, `/cadastro` | Logo, slogan, erros de validação da API mostrados em cada campo |
| Início | `/` | Painel de XP, posição no ranking, progresso em blocos, próxima missão, conquistas e top 3 |
| Missões | `/missoes` | Abas Disponíveis / Cumpridas / Todas, filtros de dificuldade e tipo |
| Detalhe da missão | `/missoes/:id` | Recompensa e penalidade, briefing, leitor de QR Code (câmera ou digitação), confirmação antes de registrar erro. Quizzes mostram **Iniciar quiz** |
| Quiz | `/missoes/:id/quiz` | Introdução (nº de perguntas, XP máximo, XP por acerto), uma pergunta por vez com alternativas A/B/C/D e navegação entre perguntas, confirmação antes de enviar. O resultado mostra acertos, XP proporcional, conquistas e a revisão de cada resposta. Com 0 acertos, oferece **Tentar novamente**. O progresso fica salvo se o aluno sair no meio |
| Resultado | modal | "Missão Cumprida" com +XP animado e conquistas desbloqueadas, ou a penalidade aplicada |
| Ranking | `/ranking` | Pódio, lista geral ou do seu curso, sua posição destacada e fixa |
| Conquistas | `/conquistas` | Coleção com barra segmentada e progresso até cada requisito |
| Perfil | `/perfil` | Dados, estatísticas, missões cumpridas, botão Sair |
| Admin | `/admin`, `/admin/missoes`, `/admin/missoes/nova`, `/admin/missoes/:id` | Indicadores; missões com ativar/desativar; formulário com prévia do XP pela dificuldade e gerador de QR Code |

## Identidade visual aplicada

- **Paleta:** apenas as três cores oficiais, `#000000`, `#B63A45` e `#FDFAF6`. Variações de opacidade dessas cores criam profundidade e hierarquia ([tokens.css](src/styles/tokens.css)).
  - Para textos pequenos em vermelho usamos `#DE5A66`. Ele mantém o tom da marca e atinge o contraste AA sobre o preto.
- **Tipografia:**
  - Oswald, uma fonte condensada, para títulos e números em destaque (`+250`, `#1`);
  - Public Sans, uma sans-serif geométrica, para os textos.
- **Elementos gráficos:**
  - painéis HUD com cantos chanfrados, borda vermelha fina e aba de rótulo;
  - barra de progresso segmentada;
  - texturas de grade, listras diagonais, pontos e anéis;
  - logo vetorial (mira + bandeira + caminho), com versões principal, monocromática e ícone.
- **UX mobile:**
  - navegação inferior ao alcance do polegar e ação principal fixa no rodapé;
  - alvos de toque de pelo menos 44px;
  - inputs com 16px de fonte (evita o zoom do iOS) e suporte a safe-area (notch);
  - vibração ao concluir uma missão;
  - skeletons durante o carregamento, estados vazios e de erro com opção de tentar de novo;
  - `prefers-reduced-motion` respeitado.
- **Responsividade:** o layout é pensado a partir de 320px. Em tablets e desktops, o app fica centralizado como um aparelho sobre a textura da marca.

## Estrutura

```
src/
├── api/          client.js (fetch + JWT + erros) · mock.js (API simulada)
├── context/      AuthContext (sessão/perfil) · ToastContext
├── hooks/        useFetch
├── components/   ui.jsx (HudCard, SegmentBar, Button, Field, Sheet...) · Layout · Logo
│                 MissionCard · Badge · QrScanner · ResultSheet
├── pages/        Login · Cadastro · Home · Missoes · MissaoDetalhe · Ranking · Conquistas · Perfil
│   └── admin/    AdminDashboard · AdminMissoes · MissaoForm
├── styles/       tokens.css · base.css · components.css · pages.css
└── utils/        rules.js (espelho das regras de XP) · icons.js
```

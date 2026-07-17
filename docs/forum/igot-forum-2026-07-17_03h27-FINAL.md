# 📌 Fórum FINAL igot — 17 de julho de 2026, 03:27

> **Fórum consolidado com TODAS as inovações, credenciais, endereços e arquivos.**
> Feito para ser passado pra outra IA analisar e continuar o projeto.
>
> **Para retomar o projeto numa nova IA**, envie estes 3 arquivos:
> 1. ESTE fórum
> 2. `docs/PROJECT_ARCHIVE.md`
> 3. `docs/JORNADA.md`

---

## 📋 ÍNDICE

1. [O que é o igot](#o-que-é-o-igot)
2. [Todas as inovações (40+ marcos)](#-todas-as-inovações)
3. [Arquitetura técnica](#-arquitetura-técnica)
4. [Credenciais e serviços](#-credenciais-e-serviços)
5. [Estrutura de arquivos](#-estrutura-de-arquivos)
6. [Como retomar o projeto](#-como-retomar-o-projeto)
7. [Pendentes e roadmap](#-pendentes-e-roadmap)
8. [Modelo premium (pesquisa)](#-modelo-premium-pesquisa)
9. [Todos os fóruns e documentos](#-todos-os-fóruns-e-documentos)

---

## 💡 O que é o igot

**igot** ("I got it!") é um leitor de e-books com IA integrada. Leia qualquer
livro em qualquer língua, sobre qualquer assunto — a IA traduz, explica, resume
e responde perguntas com fundamento no texto.

**Tagline**: "Leia qualquer coisa. Entenda tudo."

**Desenvolvedor**: Miguel do Rosário — Cafezinho Media Group
**Contato**: migueldorosario@gmail.com — Niterói, RJ, Brasil

---

## 🚀 Todas as inovações

### Fundação (Dia 1 — 13/07)
1. **Conceito** definido + nome "igot" ("I got it!")
2. **Monorepo** (npm workspaces): `apps/web` + `packages/{ai-providers,parser,rag}`
3. **Parser EPUB** (JSZip + DOMParser) → estrutura comum (chapters/blocks)
4. **Parser PDF** (pdfjs-dist) → inicialmente texto extraído, depois render real
5. **Leitor web** (Next.js App Router + React + TypeScript)
6. **7 provedores de IA** (BYOK): Z.ai, OpenAI, DeepSeek, Kimi, Qwen, Anthropic, Gemini

### Multi-provedor (Dia 1-2)
7. **BYOK** (Bring Your Own Key): usuário traz a própria chave
8. **Proxy com allowlist** anti-SSRF (`/api/proxy`)
9. **Adapter genérico OpenAI-compatible** (serve 5 provedores)
10. **Adapter dedicado Anthropic** (formato próprio: /messages, x-api-key)
11. **Adapter dedicado Gemini** (x-goog-api-key, modelo no path)
12. **Chave criptografada** (AES-GCM 256, Web Crypto API) no localStorage

### PWA + Deploy (Dia 2)
13. **PWA instalável** (manifest, service worker, ícones, meta tags iOS)
14. **Deploy na Vercel**: `igot-taupe.vercel.app`
15. **Renderização fiel de PDF** (canvas + TextLayer do pdfjs 4.x)

### UX e features (Dia 2-3)
16. **Streaming de respostas** (SSE — texto chega palavra por palavra)
17. **Traduzir página inteira** (overlay formatado como página de livro)
18. **Explicar página inteira** (sentido geral, termos-chave, contexto)
19. **Toggle Original ⇄ Tradução** (sem re-traduzir)
20. **Zoom** (50% a 300%) com medição estável
21. **Toque duplo** = seleciona parágrafo (EPUB)
22. **Seleção amarela destacada** (marca-texto)
23. **Menu Traduzir/Explicar no touch** (selectionchange listener)
24. **Supressão do menu nativo iOS** (-webkit-touch-callout: none)

### Persistência (Dia 3)
25. **IndexedDB** (sessão de leitura: livro, página, zoom, traduções, notas)
26. **Login Google** (Supabase + OAuth + cookies HttpOnly)
27. **Sincronização híbrida** (logado = nuvem, deslogado = local)
28. **Timeout de segurança** (nunca trava no boot)
29. **Notas/anotações** (📌 Salvar + 📓 modal de notas)

### Estante e rotas (Dia 4 — 16/07)
30. **Estante visual** (grid de capas dos livros)
31. **Rotas com URL própria** (`/book/[id]`)
32. **Migração automática** (store legado → novo)
33. **Deduplicação** (mesmo título = mesmo livro)
34. **Limpar tudo** (IndexedDB + Supabase + legado)

### Design (Dia 4-5)
35. **Redesign visual** (design tokens, tipografia serifada, onboarding)
36. **Barra de progresso** no header (estilo Kindle)
37. **Slider de navegação rápida** (arrastar pra pular páginas)
38. **Swipe** (passar página passando o dedo)
39. **Tela cheia** (Fullscreen API com botões de IA visíveis)
40. **Mensagens i18n** (8 idiomas: pt-BR, en, es, fr, zh, ru, de, ja)
41. **Botão "🔍 Procurar modelos"** (busca modelos do provedor)
42. **Seção de ajuda** (O que é API?, ranking de preços)
43. **Quem somos** (Cafezinho Media Group)
44. **Botão de doação** (☕ Apoie o igot)

---

## 🏗️ Arquitetura técnica

```
┌──────────────────┐     ┌─────────────────────────────────────────┐
│  Frontend        │     │  Next.js (App Router) + React + TS      │
│  Web/PWA         │◄────┤  • /api/proxy (IA, anti-SSRF)           │
│  → depois mobile │     │  • /api/proxy-stream (SSE streaming)    │
└──────┬───────────┘     │  • /api/auth/callback (Google OAuth)    │
       │                 └──────────────────┬──────────────────────┘
       │                                    │
       │  ┌─────────────────────────────────┴───────────────┐
       │  │ Repository adapter (hybrid)                     │
       │  │ • Logado → Supabase (nuvem, sincroniza)         │
       │  │ • Deslogado → IndexedDB (local, fallback)       │
       │  └─────────────────────────────────────────────────┘
       │
       ├── 7 provedores de IA (BYOK, chave criptografada no localStorage)
       │   Z.ai · OpenAI · DeepSeek · Kimi · Qwen · Anthropic · Gemini
       │
       └── Formatos: EPUB (texto estruturado) + PDF (render real canvas)
```

### Rotas
```
/                        → Estante (grid de capas)
/book/[id]               → Leitura de um livro (URL própria)
/api/proxy               → Proxy de IA (CORS, anti-SSRF)
/api/proxy-stream        → Proxy de streaming (SSE)
/api/auth/callback       → Callback Google OAuth
```

### Pacotes
- `@igot/ai-providers` — 7 adapters + transport + registry + streaming
- `@igot/parser` — EPUB (JSZip) + PDF (pdfjs-dist)
- `@igot/rag` — (futuro) Q&A com grounding no texto

---

## 🔑 Credenciais e serviços

### GitHub (código)
| Campo | Valor |
|-------|-------|
| Repo | https://github.com/migueldorosario1/igot |
| Branch | main |
| Conta | migueldorosario1 |

### Vercel (deploy)
| Campo | Valor |
|-------|-------|
| URL pública | https://igot-taupe.vercel.app |
| Projeto | igot |
| Conta | migueldorosario1 |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` |

### Supabase (banco + auth)
| Campo | Valor |
|-------|-------|
| Project ID | `nsasbuqeeqdwsagpfpcc` |
| URL | https://nsasbuqeeqdwsagpfpcc.supabase.co |
| Painel | https://supabase.com/dashboard/project/nsasbuqeeqdwsagpfpcc |
| Tabela | `books` (RLS: user_id = auth.uid()) |
| Provider Google | Ativado |
| Schema SQL | `apps/web/supabase/schema.sql` |

### Google Cloud OAuth
| Campo | Valor |
|-------|-------|
| Projeto | igot |
| Client ID | (ver Google Console → Credentials) |
| Client Secret | (ver Google Console → Credentials — NÃO commitar) |
| Redirect URI | https://nsasbuqeeqdwsagpfpcc.supabase.co/auth/v1/callback |
| Origens JS | https://igot-taupe.vercel.app |
| Console | https://console.cloud.google.com |

### Variáveis de ambiente (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://nsasbuqeeqdwsagpfpcc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_evQ18njkVrsNhgn2H40e0w_5NBLtNUd
NEXT_PUBLIC_SITE_URL=https://igot-taupe.vercel.app
```

---

## 📂 Estrutura de arquivos

```
igot/
├── apps/web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/{proxy,proxy-stream,auth/callback}/
│   │   │   ├── book/[id]/page.tsx        ← rota de livro
│   │   │   ├── globals.css               ← design tokens + layout
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                  ← estante (home)
│   │   ├── components/
│   │   │   ├── AIPanel.tsx               ← painel IA (streaming, sem markdown)
│   │   │   ├── AuthButton.tsx            ← login Google
│   │   │   ├── PdfPageCanvas.tsx         ← render PDF (canvas + TextLayer)
│   │   │   ├── Reader.tsx                ← leitor (swipe, zoom, fullscreen)
│   │   │   ├── ServiceWorkerRegister.tsx
│   │   │   ├── SettingsForm.tsx          ← config IA (models, ajuda, quem somos)
│   │   │   ├── SettingsModal.tsx
│   │   │   └── Uploader.tsx              ← onboarding
│   │   └── lib/
│   │       ├── ai-client.ts              ← translate/explain/ask + streaming
│   │       ├── auth.ts                   ← hook useAuth
│   │       ├── config.ts                 ← BYOK criptografado
│   │       ├── crypto.ts                 ← AES-GCM 256
│   │       ├── db.ts                     ← IndexedDB (books + sessions)
│   │       ├── messages.ts               ← i18n (8 idiomas)
│   │       ├── repository.ts             ← adapter nuvem vs local
│   │       ├── session.ts                ← hook useSession
│   │       ├── supabase/{client,server}.ts
│   │       └── types.ts
│   ├── public/ (ícones, manifest, sw.js)
│   ├── supabase/schema.sql
│   └── package.json
├── packages/
│   ├── ai-providers/ (7 adapters + transport + registry + streaming)
│   ├── parser/ (EPUB + PDF)
│   └── rag/ (futuro)
├── docs/
│   ├── CONCEPT.md
│   ├── STRATEGY.md
│   ├── PROJECT_ARCHIVE.md
│   ├── JORNADA.md
│   └── forum/
│       ├── README.md (índice)
│       ├── 01-estante.md ... 10-design.md (sub-fóruns)
│       └── igot-forum-*.md (sessões)
├── README.md, ROADMAP.md, AGENTS.md, CONTRIBUTING.md, LICENSE
├── package.json, tsconfig.base.json, vercel.json
└── next.config.mjs (apps/web)
```

---

## 🔄 Como retomar o projeto

Para continuar numa nova IA:

> "Continua o projeto igot. Lê estes arquivos pra retomar o contexto:
> 1. https://github.com/migueldorosario1/igot/blob/main/docs/forum/igot-forum-2026-07-17_03h27-FINAL.md
> 2. https://github.com/migueldorosario1/igot/blob/main/docs/PROJECT_ARCHIVE.md
> 3. https://github.com/migueldorosario1/igot/blob/main/docs/JORNADA.md"

### Rodar localmente
```bash
git clone git@github.com:migueldorosario1/igot.git
cd igot
npm install
npm run dev    # http://localhost:3000
```

### Deploy
```bash
vercel --prod --yes
```

---

## ⏳ Pendentes e roadmap

| # | Tarefa | Prioridade |
|---|--------|------------|
| 1 | **Destravar login Google** (Site URL no Supabase: localhost → igot-taupe.vercel.app) | 🔴 Alta |
| 2 | **TTS** (leitura em voz alta — Web Speech API) | 🟡 Média |
| 3 | **Marcadores de página** (bookmarks) | 🟡 Média |
| 4 | **Comentários** (texto + áudio com speech-to-text) | 🟡 Média |
| 5 | **Capas dos livros** na estante (thumbnail da página 1) | 🟡 Média |
| 6 | **RAG** (IA com memória do livro inteiro — pgvector) | 🟢 Baixa |
| 7 | **Capacitor** → Google Play (Android) | 🟢 Baixa |
| 8 | **iOS** via GitHub Actions (sem Mac) | 🟢 Baixa |
| 9 | **i18n completo** (interface em todos os idiomas) | 🟢 Baixa |
| 10 | **Loja da China** (WeChat Mini Program) | 🟢 Baixa |

---

## 💰 Modelo premium (pesquisa)

### Tiers
| Tier | Preço | Custo IA | Margem |
|------|-------|----------|--------|
| **Free** | $0 (BYOK) | $0 (usuário paga) | — |
| **Premium** | $7,99-9,99/mês | ~$0,07-0,29 (DeepSeek/GLM) | ~97% |
| **Pro** | $14,99-19,99/mês | ~$1-2 (GPT-5 Mini/Claude) | ~85% |

### Melhor provedor pra premium
- **DeepSeek V3**: $0,07/usuário/mês (pesado) — melhor margem
- **GLM-5.2**: $0,29/usuário/mês — output muito barato
- **Roteamento**: barato pra tradução, mid-tier pra explicação complexa

### Cobrança
- **RevenueCat + Stripe** (web: Stripe ~3% taxa; mobile: lojas 15-30%)
- Priorizar canal web (margem muito maior)

### Parcerias
- **OpenRouter**: agrega 400+ modelos, 5,5% fee, sem markup. DESABILITAR logging.
- **Together AI**: créditos startup até $50K
- **Anthropic**: Claude for Startups até $100K em créditos
- Revender API "crua" é proibido, mas usar como backend do app é permitido

---

## 📚 Todos os fóruns e documentos

| Documento | O quê | Link |
|-----------|-------|------|
| **Este fórum** | Consolidado final | `docs/forum/igot-forum-2026-07-17_03h27-FINAL.md` |
| Fórum 16/07 | Estante, rotas, estabilização | `docs/forum/igot-forum-2026-07-16_19h53.md` |
| Fórum 15/07 | Sessão fundadora | `docs/forum/igot-forum-2026-07-15_20h02.md` |
| Índice de fóruns | 10 sub-fóruns por aspecto | `docs/forum/README.md` |
| Jornada | Handoff completo | `docs/JORNADA.md` |
| Cofre | Credenciais + arquitetura | `docs/PROJECT_ARCHIVE.md` |
| Estratégia | Lojas, marketing, pricing | `docs/STRATEGY.md` |
| Conceito | Visão e princípios | `docs/CONCEPT.md` |
| Roadmap | Fases do projeto | `ROADMAP.md` |

---

_Registrado em 17 de julho de 2026, 03:27. O GitHub é o nosso cérebro._
_Cafezinho Media Group — Niterói, RJ — Brasil_

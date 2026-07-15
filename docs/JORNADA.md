# 📜 Jornada do igot — Registro de Sessão

> **Como usar este arquivo**: quando começar uma nova conversa com o ZCode,
> mande o link deste arquivo junto com `PROJECT_ARCHIVE.md`. Eles juntos dão
> o contexto completo pra retomar o projeto de onde paramos.
>
> **Links**:
> - Este arquivo: https://github.com/migueldorosario1/igot/blob/main/docs/JORNADA.md
> - Cofre: https://github.com/migueldorosario1/igot/blob/main/docs/PROJECT_ARCHIVE.md

---

## 🗓️ Sessão: 13–15 de julho de 2026

**Participantes**: Miguel Dorosario (idealizador) + ZCode (agente de IA)

### O que construímos do zero

Começamos com uma ideia ("um Readera com cérebro") e terminamos com um app
funcional, deployado, com login Google e estratégia de lojas definida.

---

## ✅ Tudo que foi implementado (em ordem)

### Dia 1 (13/07) — Conceito e MVP

1. **Conceito** definido: leitor de e-books com IA que traduz e explica.
   Nome: **igot** ("I got it!"). Tagline: "Leia qualquer coisa. Entenda tudo."

2. **Repositório GitHub** criado: `migueldorosario1/igot` (público)
   - README, ROADMAP, CONCEPT, AGENTS.md, CONTRIBUTING, LICENSE MIT
   - Estrutura de monorepo: `apps/web` + `packages/{ai-providers,parser,rag}`

3. **MVP (Fase 1)** construído:
   - `packages/ai-providers`: adapter Z.ai (GLM) com `getDefaultProvider()`
   - `packages/parser`: parsers EPUB (JSZip) + PDF (pdfjs-dist)
   - `apps/web` (Next.js): home com upload, leitor com seleção, painel IA
   - API Routes server-side (`/api/translate`, `/api/explain`, `/api/ask`)

### Dia 1–2 (13–14/07) — Multi-provedor (BYOK)

4. **Refatoração multi-provedor**: usuário escolhe a IA, cola a própria chave.
   - Adapter genérico OpenAI-compatible (Z.ai, OpenAI, DeepSeek, Kimi, Qwen)
   - Adapter dedicado Anthropic (formato próprio)
   - Adapter dedicado Gemini (formato próprio do Google)
   - **7 provedores** no total
   - `/api/proxy` com allowlist anti-SSRF (fura CORS)
   - Página `/settings` → depois virou **modal** (não perde o livro)
   - BYOK: chave fica no localStorage, **nunca** no servidor

### Dia 2 (14/07) — PWA + Deploy

5. **PWA instalável** no iPad/iPhone:
   - Ícone 💡 (SVG + PNG 192/512 + apple-touch-icon)
   - `manifest.json` (standalone, theme color)
   - Service worker (offline-first conservador)
   - Meta tags iOS (apple-web-app, viewport)

6. **Deploy na Vercel**: `https://igot-taupe.vercel.app`
   - Monorepo com `vercel.json` na raiz (`framework: nextjs`)
   - Região: São Paulo (gru1)

### Dia 2–3 (14–15/07) — Correções de PDF e UX

7. **Renderização fiel de PDF** (não mais texto extraído):
   - `PdfPageCanvas`: renderiza página real num `<canvas>` (pdfjs)
   - TextLayer por cima (texto selecionável)
   - Fit-to-viewport (cabe inteiro em paisagem)
   - Zoom +/− (50% a 300%)
   - Anti-flash (visibility:hidden até render completar)

8. **Imagens do EPUB**: resolver `src` lendo do ZIP → data URL embutida.
   Capas e ilustrações agora aparecem.

9. **Filtro de capítulos triviais**: pula copyright/keywords (densidade de texto).

10. **Tradução de página inteira** (overlay):
    - Botão "🌐 Traduzir página" no header
    - Overlay branco com tipografia serifada (página de livro)
    - Toggle **Original ⇄ Tradução** (sem re-traduzir)
    - `translatePage()` com prompt otimizado (parágrafos coerentes)

11. **Streaming**: texto chega palavra por palavra (SSE).
    - `stream()` em todos os 3 adapters
    - `/api/proxy-stream` (devolve Response bruto)
    - `translateStream`, `translatePageStream`, `explainStream`

12. **Toque duplo = seleciona parágrafo** (EPUB).

13. **Seleção amarela destacada** (`#ffd84d`, marca-texto).

14. **Menu Traduzir/Explicar no touch**: `selectionchange` listener (mouse E touch).

### Dia 3 (14–15/07) — Persistência e memória

15. **Persistência local (IndexedDB)**:
    - `lib/db.ts`: Session (book, pdfSource, chapterIdx, zoom, translations, notes)
    - `lib/session.ts`: hook `useSession` (hidratação + debounce 500ms)
    - Timeout de segurança (3s boot, 5s openDB) — nunca trava no Safari

16. **Botão "📂 Abrir outro"**: fecha livro, volta pro uploader.

17. **Botão "📌 Salvar"**: anotações (tradução/explicação/pergunta) no IndexedDB.

18. **Modal "📓 Notas"**: lista anotações com data, tipo, trecho, resposta.

### Dia 3 (15/07) — Login Google (Fase B)

19. **Login Google via Supabase**:
    - `@supabase/supabase-js` + `@supabase/ssr`
    - `lib/supabase/{client,server}.ts`
    - `/api/auth/callback` (PKCE, cookies HttpOnly)
    - `lib/auth.ts`: hook `useAuth` (status, user, signIn, signOut)
    - `AuthButton`: "Entrar com Google" → avatar + dropdown Sair
    - `lib/repository.ts`: adapter híbrido (logado = Supabase, deslogado = IndexedDB)
    - `useSession(userId)`: re-hidrata ao logar/deslogar
    - Tabela `books` com RLS (`user_id = auth.uid()`)

20. **Mensagens de erro i18n** (8 idiomas): `lib/messages.ts`
    - 401, 429, 500, etc. traduzidos pra pt-BR, en, es, fr, zh, ru, de, ja

### Dia 3 (15/07) — Estratégia

21. **Documento estratégico** (`STRATEGY.md`): lojas, segurança, pricing, marketing
22. **Fórum** (`docs/forum/`): registro de decisões com todos os links

---

## 🐛 Bugs corrigidos (timeline)

| Bug | Causa | Fix |
|-----|-------|-----|
| PDF aparecia como texto pelado | Parser extraía texto em vez de renderizar | `PdfPageCanvas` com canvas + TextLayer |
| Capa do EPUB não aparecia | `src` apontava pro caminho interno do ZIP | `resolveImage()` lê do ZIP → data URL |
| Página cortada em paisagem | Escala só considerava largura | `fitScale` (menor entre largura e altura) |
| Flash feio no carregamento | Canvas visível durante render | `visibility:hidden` até completar |
| ArrayBuffer detached | pdfjs consome o buffer | Cópia defensiva (`data.slice(0)`) |
| Boot travado ("Carregando...") | IndexedDB pendente no Safari | Timeout de 3s/5s |
| Dev server quebrava (chunks 404) | Hot-reload excessivo | Reiniciar limpo (rm .next) |
| Login ia pra localhost | `requestUrl.origin` pegava host interno | `NEXT_PUBLIC_SITE_URL` + headers |
| Erro 429 sem explicação | Mensagem técnica crua | `toMessage()` i18n (8 idiomas) |
| `keywords` repetidos no EPUB | Parser incluía páginas triviais | Filtro por densidade de texto |

---

## ⏳ Pendentes (status atual)

| # | Tarefa | Quem | Status |
|---|--------|------|--------|
| 1 | **Site URL no Supabase** (destravar login) | Miguel | ⏳ Pendente |
| 2 | Política de Privacidade + Termos (iubenda) | ZCode pode gerar | 📋 |
| 3 | Botão de report nas respostas da IA | ZCode | 📋 |
| 4 | Fluxo de exclusão de conta (LGPD/Play) | ZCode | 📋 |
| 5 | Capacitor + Google Play (Android) | ZCode + Miguel | 📋 |
| 6 | Product Hunt launch | Miguel | 📋 |
| 7 | iOS via GitHub Actions | ZCode + Miguel | 📋 |

---

## 🧠 Como retomar numa nova conversa

Quando abrir uma nova sessão com o ZCode, mande:

> "Continua o projeto igot. Lê estes dois arquivos pra retomar o contexto:
> 1. https://github.com/migueldorosario1/igot/blob/main/docs/JORNADA.md
> 2. https://github.com/migueldorosario1/igot/blob/main/docs/PROJECT_ARCHIVE.md"

Com isso, o agente recupera: o que foi construído, as credenciais, a
arquitetura, os bugs corrigidos, e os próximos passos.

---

## 📂 Estrutura atual do repositório

```
igot/
├── apps/web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/{proxy,proxy-stream,auth/callback}/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── AIPanel.tsx
│   │   │   ├── AuthButton.tsx
│   │   │   ├── PdfPageCanvas.tsx
│   │   │   ├── Reader.tsx
│   │   │   ├── ServiceWorkerRegister.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── Uploader.tsx
│   │   └── lib/
│   │       ├── ai-client.ts
│   │       ├── auth.ts
│   │       ├── config.ts
│   │       ├── db.ts
│   │       ├── messages.ts
│   │       ├── repository.ts
│   │       ├── session.ts
│   │       ├── supabase/{client,server}.ts
│   │       └── types.ts
│   ├── public/ (ícones, manifest, sw.js)
│   ├── supabase/schema.sql
│   ├── .env.example
│   ├── next.config.mjs
│   ├── vercel.json
│   └── package.json
├── packages/
│   ├── ai-providers/ (7 adapters + transport + registry)
│   ├── parser/ (EPUB + PDF)
│   └── rag/ (futuro)
├── docs/
│   ├── CONCEPT.md
│   ├── STRATEGY.md
│   ├── PROJECT_ARCHIVE.md
│   ├── JORNADA.md ← ESTE ARQUIVO
│   └── forum/igot-forum-2026-07-15_20h02.md
├── README.md
├── ROADMAP.md
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── tsconfig.base.json
└── vercel.json
```

---

_Registrado em 15 de julho de 2026. O GitHub é o nosso cérebro._

# 🧠 Arquivo Imortal — Projeto igot

> Documento canônico com tudo que importa sobre o projeto. Este arquivo vive
> no repositório (GitHub) e sobrevive a qualquer conversa, sessão ou dispositivo.

**Última atualização**: 14 de julho de 2026
**Dono do projeto**: Miguel Dorosario (`migueldorosario1`)

---

## O que é o igot

Leitor de e-books com IA integrada. Leia qualquer livro em qualquer língua,
sobre qualquer assunto — a IA traduz, explica, resume e responde perguntas
com fundamento no texto. Multi-provedor (BYOK), local-first, com login
opcional pra sincronização na nuvem.

- **Repo**: https://github.com/migueldorosario1/igot
- **App público**: https://igot-taupe.vercel.app
- **Conceito**: [`docs/CONCEPT.md`](./CONCEPT.md) · [`README.md`](../README.md)

---

## 🔑 Credenciais e serviços

> ⚠️ NUNCA commite segredos no código. Este arquivo documenta **onde** cada
> coisa está configurada, não os valores secretos em si.

### Supabase (banco Postgres + Auth + Storage)

| Campo | Valor |
|-------|-------|
| Project ID | `nsasbuqeeqdwsagpfpcc` |
| Project URL | `https://nsasbuqeeqdwsagpfpcc.supabase.co` |
| Painel | `https://supabase.com/dashboard/project/nsasbuqeeqdwsagpfpcc` |
| Tabela principal | `books` (com RLS: `user_id = auth.uid()`) |
| Provider Google | Ativado |
| Schema SQL | [`apps/web/supabase/schema.sql`](../apps/web/supabase/schema.sql) |

### Google Cloud OAuth

| Campo | Valor |
|-------|-------|
| Projeto Google Cloud | `igot` |
| Client ID | (em Google Console → Credentials) |
| Client Secret | (em Google Console → Credentials, **NÃO commar**) |
| Origens JS | `https://igot-taupe.vercel.app` |
| Redirect URI | `https://nsasbuqeeqdwsagpfpcc.supabase.co/auth/v1/callback` |
| Console | `https://console.cloud.google.com` |

### Vercel (deploy/produção)

| Campo | Valor |
|-------|-------|
| Projeto | `igot` |
| URL pública | `https://igot-taupe.vercel.app` |
| Conta | `migueldorosario1` |
| Variáveis de ambiente | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### GitHub

| Campo | Valor |
|-------|-------|
| Repo | `https://github.com/migueldorosario1/igot` |
| Branch principal | `main` |

---

## 🏗️ Arquitetura (resumo)

```
┌──────────────┐   ┌──────────────────────────────────────┐
│ Frontend     │   │ Next.js (App Router) + React + TS    │
│ Web/PWA      │   │ • /api/proxy (IA, anti-SSRF)         │
│ → depois mobile│  │ • /api/proxy-stream (SSE streaming)  │
└──────┬───────┘   │ • /api/auth/callback (Google OAuth)  │
       │           └──────────────────┬───────────────────┘
       │                              │
       │  ┌───────────────────────────┴─────────────────┐
       │  │ Repository adapter (hybrid)                  │
       │  │ • Logado → Supabase (nuvem, sincroniza)      │
       │  │ • Deslogado → IndexedDB (local, fallback)    │
       │  └──────────────────────────────────────────────┘
       │
       ├── 7 provedores de IA (BYOK, chave no localStorage)
       │   Z.ai · OpenAI · DeepSeek · Kimi · Qwen · Anthropic · Gemini
       │
       └── Format: EPUB (texto estruturado) + PDF (render real)

Packages:
- @igot/ai-providers  — adapters multi-provedor + streaming
- @igot/parser        — parsers EPUB/PDF → ParsedBook comum
```

### Monorepo
```
igot/
├── apps/web/           # Next.js (PWA)
├── packages/
│   ├── ai-providers/   # GLM/OpenAI/DeepSeek/Kimi/Qwen/Anthropic/Gemini
│   ├── parser/         # EPUB + PDF
│   └── rag/            # (futuro) Q&A com grounding no texto
├── docs/               # ← ESTE ARQUIVO tá aqui
└── README.md
```

---

## 🚦 Status das fases

- **Fase 0** ✅ Conceito + scaffolding
- **Fase 1** ✅ MVP: leitor EPUB/PDF + seleção → Traduzir/Explicar
- **Persistência** ✅ IndexedDB local (livro, página, zoom, traduções, notas)
- **PWA** ✅ Instalável no iPad/iPhone (ícone, tela cheia, offline básico)
- **Multi-provedor** ✅ BYOK, 7 provedores (Z.ai/OpenAI/DeepSeek/Kimi/Qwen/Anthropic/Gemini)
- **Streaming** ✅ Tradução/explicação chegam palavra por palavra
- **Traduzir página** ✅ Overlay formatado como página de livro + toggle Original ⇄ Tradução
- **Anotações** ✅ Botão 📌 Salvar + modal 📓 Notas
- **Fase B (Login Google)** ⚙️ Código completo; depende de configurar Supabase + Google OAuth
- **Fase 2 (RAG)** 📋 Futuro: Q&A fundamentado no texto da obra
- **Lojas (Play/App Store)** 📋 Futuro: Capacitor

---

## 🔐 Princípios de segurança

1. **Chave de IA (BYOK) NUNCA vai pra nuvem** — fica em `localStorage`, por device
2. **Supabase RLS** — cada usuário só acessa seus próprios dados
3. **Proxy com allowlist** — anti-SSRF (`/api/proxy` e `/api/proxy-stream`)
4. **Cookies HttpOnly** — sessão de auth não acessível via JS (XSS-safe)
5. **Secrets do Google** — só no Supabase (backend), nunca no bundle do app

---

## 🛠️ Comandos úteis

```bash
# Rodar localmente
cd /home/migueldorosario/ZCodeProject/igot
npm run dev                    # http://localhost:3000

# Build de produção
npm run build

# Deploy (Vercel CLI autenticada como migueldorosario1)
vercel --prod --yes

# Verificar status do servidor local
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

---

## 📞 Contexto de criação

Este projeto foi concebido e construído em conjunto com o **ZCode** (agente
de IA), numa sessão longa em julho de 2026, a partir da ideia original do
Miguel: um "Readera com cérebro" — um leitor que conhece o livro inteiro e
ajuda a destravar a leitura em qualquer língua.

O nome **igot** vem de *"I got it!"* — o momento em que você finalmente
entendeu. O leitor que te faz chegar lá.

---

_Este arquivo é o cofre do projeto. Edite sempre que algo mudar._

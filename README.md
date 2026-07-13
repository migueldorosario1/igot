<div align="center">

# 💡 igot

### Leia qualquer coisa. Entenda tudo.
### *Read anything. Understand everything.*

[![Status](https://img.shields.io/badge/status-concept%20%2F%20scaffolding-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%2F%20PWA-orange)]()

</div>

> **igot** — do inglês _"I got it!"_: o momento em que você finalmente entendeu.
> Um leitor de e-books com um cérebro de IA ao lado do texto.

---

## 🎯 O problema

Hoje você pode abrir qualquer livro do mundo num leitor gratuito (PDF, EPUB, MOBI...).
Mas **entender** um livro em outra língua, ou sobre um assunto difícil, continua sendo
uma barreira. Você para, copia um trecho, joga num tradutor, volta, perde o fio.
Para textos densos — acadêmicos, técnicos, clássicos — a leitura simplesmente não acontece.

## 💡 A ideia

Um leitor que **conhece o livro inteiro** e te ajuda a destravar a leitura em tempo real:

- 🌐 **Tradução inteligente** — do trecho selecionado, respeitando o contexto da obra
- 📖 **Visão bilíngue** — original e tradução lado a lado, ou interlinear
- 🧠 **Explicação sob toque** — toque numa palavra, frase ou idiotismo → a IA explica
- 📝 **Resumos** — de capítulo ou da obra; mapa de personagens e ideias
- ❓ **Pergunte ao livro** — Q&A fundamentado no texto (RAG), sem invenção
- 🗣️ **Modo idiomas** — flashcards de vocabulário extraídos do que você leu

## 🔌 IA agnóstica — você escolhe o provedor

O igot **não te prende a uma IA**. Na tela de Configurações (`/settings`) você
escolhe o provedor e cola a **própria chave** (BYOK — *bring your own key*).
Sua chave fica no seu navegador (localStorage); nunca é persistida no servidor.

Provedores suportados:

| Provedor | Destaque |
|----------|----------|
| **Z.ai (GLM)** 🇨🇳 | Janela de contexto longa, multilíngue |
| **OpenAI** | GPT-4o e família — padrão de mercado |
| **DeepSeek** 🇨🇳 | Custo-benefício e raciocínio |
| **Kimi (Moonshot)** 🇨🇳 | Contexto gigante (128k+) |
| **Qwen (Alibaba)** 🇨🇳 | Multilíngue fortíssimo, ótimo em tradução |
| **Anthropic** | Modelos Claude — forte em escrita |

Os modelos chineses são particularmente interessantes para este uso (janela de
contexto enorme, multilíngue robusto, custo por token baixo), mas a escolha é
sempre sua. A arquitetura é **multi-provedor plugável**: adicionar um novo é só
incluí-lo no catálogo de presets.

## 🏗️ Arquitetura

```
┌──────────────────┐     ┌─────────────────────────────────────────┐
│  Frontend        │     │  Backend                                │
│  Web (PWA)       │◄────┤   • /api/proxy (fura CORS, allowlist)   │
│  Next.js + React │     │   • Parser: EPUB / PDF (+ MOBI/TXT)     │
│  → depois mobile │     │   • Motor RAG (Fase 2)                  │
└────────┬─────────┘     └──────────────────┬──────────────────────┘
         │                                  │
   config no localStorage           repassa ao provedor
   (BYOK: chave do usuário)              escolhido pelo usuário
         │                                  │
         └──────────► /api/proxy ──────────►├─ Z.ai (GLM)
                                            ├─ OpenAI
                                            ├─ DeepSeek
                                            ├─ Kimi (Moonshot)
                                            ├─ Qwen (Alibaba)
                                            └─ Anthropic
```

## 🧱 Stack

- **Frontend + API:** Next.js (App Router) + React + TypeScript
- **IA:** multi-provedor plugável via `packages/ai-providers` (BYOK); chamadas
  roteadas por um `/api/proxy` leve que fura o CORS dos provedores
- **Parsing:** EPUB (estruturado) + PDF (texto extraído) — ambos no MVP
- **Banco + Vetores:** PostgreSQL + pgvector (a confirmar na Fase 2)
- **Persistência local (config de IA):** localStorage (chave nunca no servidor)

## 📐 Estrutura do repositório

```
igot/
├── apps/
│   └── web/                 # App Next.js (PWA)
├── packages/
│   ├── ai-providers/        # Camada de abstração de provedores de IA
│   ├── parser/              # Parsers de PDF/EPUB/MOBI/TXT
│   └── rag/                 # Indexação vetorial + Q&A
├── docs/                    # Documentação e conceito
└── README.md
```

## 🚦 Status

**Fase 1 (MVP) implementada** — leitor EPUB/PDF + assistente de IA multi-provedor
(traduzir / explicar / perguntar). Configure sua chave de IA em `/settings`.

👉 Veja o [**ROADMAP**](./ROADMAP.md) completo.

## ▶️ Como rodar

```bash
git clone git@github.com:migueldorosario1/igot.git
cd igot
npm install
npm run dev          # abre http://localhost:3000
```

Depois, em `http://localhost:3000/settings`, escolha o provedor de IA e cole
sua chave (fica no seu navegador). Sem isso, as ações de IA não funcionam —
mas o leitor já abre e navega pelos livros.

## 🤝 Como contribuir

Este é um projeto em construção, aberto a quem se empolgar com a ideia.
Leia o [**CONTRIBUTING**](./CONTRIBUTING.md) e o [**CONCEPT**](./docs/CONCEPT.md).

## 📄 Licença

[MIT](./LICENSE) — use, forks, contribua à vontade.

---

<div align="center">

**igot** — _porque todo livro merece ser entendido._

</div>

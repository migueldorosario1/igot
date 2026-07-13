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

## 🇨🇳 Por que uma IA chinesa?

Os modelos de IA chineses estão entre os melhores do mundo e têm características
**perfeitas** para este uso:

| Vantagem | Por que importa |
|----------|-----------------|
| **Janela de contexto gigante** (Qwen, DeepSeek, GLM) | Cabe um livro inteiro → Q&A e resumo de verdade |
| **Multilíngue robusto** | Português ↔ Mandarim ↔ Inglês ↔ Russo ↔ ... |
| **Custo-benefício** | Mais barato por token → uso contínuo viável |
| **Independência de provedores ocidentais** | Resiliência e soberania tecnológica |

A arquitetura é **multi-provedor plugável**: **Z.ai (GLM)** como padrão no MVP,
com DeepSeek, Qwen, OpenAI e Anthropic como opcionais. Nunca ficamos reféns de um só.

## 🏗️ Arquitetura

```
┌──────────────────┐     ┌─────────────────────────────────────────┐
│  Frontend        │     │  Backend                                │
│  Web (PWA)       │◄────┤   • Parser: PDF / EPUB / MOBI / TXT     │
│  Next.js + React │     │   • Motor RAG (vetores)                 │
│  → depois mobile │     │   • Orquestrador de IA (plugável)       │
└──────────────────┘     │   • Cache de tradução                   │
                         └──────────────────┬──────────────────────┘
                                            │
              ┌─────────────────┬───────────┴───────────┬──────────────┐
              ▼                 ▼                       ▼              ▼
         Z.ai (GLM)       DeepSeek                  Qwen          OpenAI
         [padrão MVP]                                    [+ Anthropic]
```

## 🧱 Stack (planejada)

- **Frontend:** Next.js + React + TypeScript (PWA)
- **Backend:** Node/TypeScript (ou Python/FastAPI — a definir)
- **Banco + Vetores:** PostgreSQL + pgvector (ou Chroma)
- **Parsing:** pdf.js / PyMuPDF (PDF), epub.js (EPUB)
- **IA:** SDKs plugáveis (Z.ai GLM, DeepSeek, Qwen, ...)

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

**Fase 0 — Conceito & Scaffolding.** O repositório está nascendo agora.
Nenhum código funcional ainda — só a ideia, a estrutura e o roadmap.

👉 Veja o [**ROADMAP**](./ROADMAP.md) completo.

## 🤝 Como contribuir

Este é um projeto em construção, aberto a quem se empolgar com a ideia.
Leia o [**CONTRIBUTING**](./CONTRIBUTING.md) e o [**CONCEPT**](./docs/CONCEPT.md).

## 📄 Licença

[MIT](./LICENSE) — use, forks, contribua à vontade.

---

<div align="center">

**igot** — _porque todo livro merece ser entendido._

</div>

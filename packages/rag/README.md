# @igot/rag

Indexação vetorial e recuperação para Q&A e tradução contextualizada.

## Responsabilidades

- **Ingestão:** livro → chunks → embeddings → armazenamento vetorial
- **Recuperação:** dada uma pergunta, achar os trechos relevantes da obra
- **Grounding:** montar o contexto que vai junto ao prompt da IA

## Princípio fundamental

> **Sem invenção.** Toda resposta da IA deve ser fundamentada em trechos
> reais da obra. O RAG é o guardião disso.

## Decisões em aberto

- **Banco vetorial:** pgvector (PostgreSQL) vs Chroma vs SQLite-vss
- **Modelo de embedding:** do próprio provedor (ex: GLM embeddings) ou dedicado
- **Estratégia de chunking:** por parágrafo, por sentença, por janela de tokens
- **Re-ranking:** necessário? com qual modelo?

_Status: ainda não implementado._

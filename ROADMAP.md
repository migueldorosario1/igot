# 🗺️ Roadmap do igot

> O caminho do conceito até um produto. Datas são orientativas — priorizamos
> algo que funcione de verdade antes de algo completo.

---

## Fase 0 — Conceito & Scaffolding ✅ _(atual)_

- [x] Definir conceito e manifesto (README)
- [x] Estrutura de repositório (monorepo)
- [x] Criar repo no GitHub
- [ ] Escrever documento de conceito detalhado (`docs/CONCEPT.md`)
- [ ] Definir stack definitiva de backend (Node vs Python)

## Fase 1 — MVP: leitor + assistente básico

> **Objetivo:** abrir um livro (EPUB **e** PDF), selecionar um trecho e receber tradução/explicação.

- [ ] App Next.js rodando localmente (App Router + TypeScript)
- [ ] Camada de IA (`packages/ai-providers`) com adapter do **Z.ai (GLM)**
- [ ] **Parser EPUB** → estrutura comum (capítulos/blocos)
- [ ] **Parser PDF** → estrutura comum (com texto extraído)
- [ ] Renderização do texto: leitor funcional (paginação, fontes, temas)
- [ ] Upload de livros (arrastar/soltar + file picker)
- [ ] Seleção de texto → menu contextual ("Traduzir" / "Explicar")
- [ ] API Routes: `/api/translate`, `/api/explain` (chave GLM no servidor)
- [ ] Painel lateral de IA conectado ao **Z.ai (GLM)**
- [ ] Tradução de seleção (prompt simples, sem contexto da obra ainda)
- [ ] Explicação de seleção (prompt simples)
- [ ] Persistência local da biblioteca (IndexedDB)

## Fase 2 — Inteligência de obra (RAG)

> **Objetivo:** a IA conhece o livro inteiro e responde com fundamento.

- [ ] Pipeline de ingestão: livro → chunks → embeddings → vetor
- [ ] Escolha de banco vetorial (pgvector vs Chroma vs SQLite-vss)
- [ ] Q&A: "O que o autor quis dizer com X?" com grounding no texto
- [ ] Resumo de capítulo (com contexto dos capítulos anteriores)
- [ ] Tradução **contextualizada** (usa a obra pra escolher o sentido certo)
- [ ] Mapa de personagens / glossário automático da obra
- [ ] Histórico de conversas por livro

## Fase 3 — Leitura bilíngue & idiomas

> **Objetivo:** ler em outro idioma de forma natural.

- [ ] Modo **intercalar** (linha original, linha traduzida)
- [ ] Modo **lado a lado**
- [ ] Detecção de idiotismos e expressões idiomáticas
- [ ] Modo **aprendiz de idiomas**: flashcards de vocabulário
- [ ] Notas de gramática automáticas
- [ ] Sincronização de progresso entre idiomas

## Fase 4 — Multi-provedor & experiência

> **Objetivo:** flexibilidade e polimento.

- [ ] Abstração de provedores madura (GLM, DeepSeek, Qwen, OpenAI, Anthropic)
- [ ] Comparador de traduções entre modelos
- [ ] Cache inteligente de traduções (não retraduzir o mesmo trecho)
- [ ] Offline-first para leitura (IA só quando solicitada)
- [ ] TTS (narrção) — opcional
- [ ] Temas, tipografia, acessibilidade

## Fase 5 — Plataforma

> **Objetivo:** sair do navegador.

- [ ] PWA instalável (funciona offline pra leitura)
- [ ] App mobile (React Native) compartilhando a camada de IA
- [ ] Sincronização na nuvem da biblioteca e anotações (opcional)
- [ ] Conta de usuário (opcional — respeitar leitura local-first)

---

## Princípios que guiam o roadmap

1. **Valor primeiro.** Cada fase entrega algo que a pessoa já consegue usar.
2. **Local-first.** O livro e as anotações são seus; a IA é um convidado.
3. **Sem invenção.** Respostas com grounding no texto, sempre.
4. **Um passo de cada vez.** EPUB antes de PDF. Simples antes de contextualizado.

---

<div align="center">

_Comentários, ideias e correções são bem-vindos._

</div>

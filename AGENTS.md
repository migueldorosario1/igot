# AGENTS.md — Guia para agentes de IA trabalhando no igot

> Este arquivo orienta agentes de codificação (como o ZCode) que contribuem
> com o repositório. Se você é humano, leia o [CONTRIBUTING](./CONTRIBUTING.md).

## O que é o igot

Leitor de e-books com IA integrada. Leia qualquer livro em qualquer língua /
assunto; a IA traduz, explica, resume e responde perguntas com fundamento no texto.

**Diferencial:** IA agnóstica (multi-provedor plugável, BYOK) — o usuário escolhe
entre Z.ai (GLM), OpenAI, DeepSeek, Kimi, Qwen e Anthropic.

## Princípios (NÃO violar)

1. **Local-first.** O livro e as anotações são do leitor. Nunca envie conteúdo
   para servidores além do provedor de IA explicitamente escolhido pelo usuário.
2. **Sem invenção (no AI hallucination).** Respostas da IA devem ter grounding
   no texto da obra. Use RAG. Cite trechos.
3. **Um passo de cada vez.** EPUB antes de PDF. Simples antes de contextualizado.
   Não antecipe features do ROADMAP que pertencem a fases futuras.
4. **Multi-provedor.** Nunca acoplar lógica a um único provedor de IA. Tudo passa
   pela camada de abstração em `packages/ai-providers`. O usuário traz a própria
   chave (BYOK) — ela fica no navegador dele, nunca persistida no servidor.

## Estrutura do monorepo

```
apps/web/           # Next.js (PWA) — frontend + API routes
packages/
  ai-providers/     # Abstração de provedores (GLM, DeepSeek, Qwen, OpenAI...)
  parser/           # Parsers de EPUB/PDF/MOBI/TXT → estrutura comum
  rag/              # Ingestão, embeddings, Q&A
docs/               # Conceito, decisões técnicas
```

## Convenções de código

- **Linguagem:** TypeScript estrito.
- **Estilo:** siga o padrão dos arquivos ao redor.
- **Commits:** conventional commits (`feat:`, `fix:`, `docs:`, ...).
- **Segredos:** NUNCA commite chaves de API. Use `.env` (já no `.gitignore`).

## Como adicionar um novo provedor de IA

1. **Se for OpenAI-compatible** (a maioria dos LLMs como serviço): basta
   adicionar um item a `PRESETS` em `packages/ai-providers/src/registry.ts`
   — sem código novo. E adicione o host à allowlist em `apps/web/src/app/api/proxy/route.ts`.
2. **Se o protocolo for diferente**: crie um adapter em
   `packages/ai-providers/src/providers/<nome>.ts` que implemente `AIProvider`,
   adicione um `AdapterKind` em `types.ts`, trate-o no `switch` de `getProvider`
   e registre o preset. Adicione o host à allowlist do proxy.

## Estado atual

**Fase 0 (conceito/scaffolding).** Sem código funcional ainda. Ao criar código,
você está estabelecendo os primeiros padrões — pense em legibilidade e em deixar
o caminho claro para quem vier depois.

## Ao iniciar trabalho

1. Leia este arquivo + README + ROADMAP.
2. Confirme em que fase/feature está trabalhando.
3. Mantenha o TODO atualizado.
4. Commits pequenos e claros.

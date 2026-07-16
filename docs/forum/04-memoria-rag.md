# 🧠 Fórum 04 — Memória (RAG)

> A IA "conhece" o livro inteiro. Você pode fazer perguntas sobre qualquer
> parte da obra, e ela responde fundamentada no texto (sem inventar).

---

## 🎯 Objetivo

Hoje a IA é **amnésica** — cada chamada é isolada, não lembra do contexto.
Com RAG (Retrieval-Augmented Generation):

1. **Indexar o livro inteiro** → dividir em chunks → gerar embeddings → guardar
2. A cada pergunta, **buscar os trechos relevantes** do livro (busca semântica)
3. Mandar esses trechos + a pergunta pra IA → resposta fundamentada
4. A IA "sabe" do livro inteiro, não só do trecho selecionado

### O que isso permite
- "O que o autor quis dizer com X?" → responde com citações do livro
- "Onde ele fala sobre Y?" → aponta os trechos relevantes
- "Resuma o capítulo 3" → resumo com contexto real
- "Compare a posição de A e B no livro" → comparação fundamentada
- "Mapa de personagens" → lista quem é quem, com referências

---

## 🏗️ Como implementar

### Pipeline de RAG
```
Livro → chunks (parágrafos) → embeddings → vetor (IndexedDB/Supabase)
                                                        ↓
Pergunta → embedding da pergunta → busca similaridade → trechos relevantes
                                                        ↓
Trechos + pergunta → IA → resposta fundamentada (com citações)
```

### Escolhas técnicas
| Decisão | Opção recomendada |
|---------|-------------------|
| **Embeddings** | Modelo de embedding do próprio provedor (GLM, OpenAI) ou modelo open-source |
| **Banco vetorial** | pgvector (Supabase) — já temos Postgres |
| **Chunking** | Por parágrafo (300-500 tokens por chunk) |
| **Busca** | Similaridade de cosseno (cosine similarity) |
| **Re-ranking** | Opcional (melhora precisão, mas custa mais) |

### Complexidade adicional
- O `packages/rag` já existe no monorepo (vazio, esperando)
- Precisa adicionar `embed()` aos adapters de IA
- Migração no Supabase (ativar extensão `pgvector`)
- UI: aba "💬 Pergunte ao livro" no painel da IA

---

## 📊 Complexidade
**Alta** (8-15 horas)
- Pipeline de embeddings + armazenamento vetorial
- Busca por similaridade
- UI de Q&A com grounding
- Testes de qualidade (respostas sem alucinação)

## 🔗 Relacionado
- É o diferencial do **tier Pro (Super Premium)** no modelo de negócio
- Depende do parser (livro estruturado) — já implementado
- Depende do Supabase (pgvector) — infra já existe

## 💰 Impacto no negócio
- RAG é o que justifica o tier Pro ($149-179/ano)
- Custo por usuário: ~$1-3/mês (embeddings + contexto aumentado)
- É o recurso que nenhum concorrente direto oferece

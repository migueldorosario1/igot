# 📐 Conceito do igot

> Documento de referência que detalha a visão. Para um resumo, veja o [README](../README.md).

## A tese

> **A barreira para a leitura nunca foi o acesso ao livro — sempre foi o entendimento.**

Hoje qualquer pessoa com internet consegue abrir um PDF/EPUB de praticamente
qualquer obra, em qualquer língua. O que falta é **compreensão**: o texto está
ali, mas não chega até o leitor. Seja por idioma, por densidade técnica, por
referências culturais, por estilo arcaico. O leitor desiste.

O igot existe para **mover a fricção**: de "preciso entender" para "a IA me ajuda
a entender — agora."

## O que nos diferencia

| Leitor tradicional (ex: Readera) | igot |
|---|---|
| Você lê. Anota. Destaca. | Tudo isso **+** a IA lê junto com você |
| Tradução = copiar, colar noutro app, voltar | Tradução no toque, **contextualizada pela obra** |
| Entender um termo = dicionário genérico | Explicação que conhece o **contexto** |
| Resumir = fazer à mão | Resumo automático com grounding no texto |
| Perguntar sobre o livro = impossível | Q&A conversacional fundamentado (RAG) |

## Casos de uso

1. **O leitor de idiomas estrangeiros**
   _"Quero ler Dostoiévski em russo, mas meu russo é intermediário."_
   → Modo intercalar + explicação de idiotismos.

2. **O estudante**
   _"Esse paper de física em inglês é denso demais."_
   → Tradução técnica contextualizada + Q&A para esclarecer conceitos.

3. **O curioso por clássicos**
   _"Quero ler Os Miseráveis, mas tenho medo de não acompanhar."_
   → Mapa de personagens + resumo de capítulos + perguntas a qualquer momento.

4. **Quem estuda mandarim**
   _"Quero ler um livro chinês e aprender o vocabulário no caminho."_
   → Flashcards extraídos do texto + notas de gramática.

## Modelo de interação

A IA **não é** um chatbot separado. Ela vive **ao lado do texto**:

```
┌─────────────────────────────────┬──────────────────────────┐
│                                 │  🧠 Assistente igot       │
│   "...o vento varria as estepes │                           │
│    e Raskólnikov, atormentado,  │  [Seleção: 'Raskólnikov'] │
│    cruzou a ponte..."  ◄── você │  → Protagonista de Crime  │
│    toca numa palavra            │    e Castigo. Ver resumo  │
│                                 │    do personagem?         │
│                                 │                           │
│                                 │  Pergunte algo... [___]   │
└─────────────────────────────────┴──────────────────────────┘
```

- **Selecionar** texto → menu: _Traduzir / Explicar / Resumir trecho_
- **Perguntar** no painel → resposta com citação da obra
- **Destacar** → vira flashcard ou anotação enriquecida

## Por que IA chinesa como padrão

Não é idéia por modismo. É uma escolha técnica com base em características
objetivas dos modelos chineses de ponta:

- **Janela de contexto enorme** (centenas de milhares de tokens): um livro inteiro
  cabe em memória, viabilizando Q&A e resumo sem particionamento grosseiro.
- **Desempenho multilíngue** robusto, com força particular em idiomas que outros
  modelos tratam mal (mandarim, russo, árabe, etc.).
- **Custo por token** significativamente menor que os provedores ocidentais
  dominantes — viabiliza uso contínuo, não só experimental.
- **Diversificação de fornecedor** — resiliência e soberania tecnológica.

**Mas não somos reféns:** a arquitetura é plugável. GLM hoje, mas qualquer
provedor (DeepSeek, Qwen, OpenAI, Anthropic) pode ser trocado ou rodado em paralelo.

## Princípios de design

1. **Local-first.** O livro e as anotações são do leitor. A nuvem é opcional.
2. **Sem invenção.** A IA fundamenta respostas no texto. Cita, não inventa.
3. **Presença lateral, não intrusiva.** A IA sugere; não toma a página.
4. **Privacidade por padrão.** Texto só vai ao provedor de IA quando o leitor pede.
5. **Acessível.** A IA reduz barreiras — não deve criar novas (interface complexa).

## O que o igot NÃO é

- **Não é** uma loja de e-books. Você traz seus arquivos.
- **Não é** um tradutor de livros inteiros automáticos (a tradução é parte da
  experiência de leitura, não substitui o ato de ler).
- **Não é** um substituto para o autor — é um facilitador do encontro leitor/obra.
- **Não é** um pirateador. Responsabilidade sobre os arquivos é do leitor.

## Perguntas em aberto (a decidir)

- [ ] Backend em Node/TypeScript ou Python/FastAPI?
- [ ] Banco vetorial: pgvector, Chroma ou SQLite-vss?
- [ ] Modelo de negócio: open-source puro, freemium com IA hospedada, ou ambos?
- [ ] Como lidar com direitos autorais ao enviar trechos à IA?
- [ ] Suporte a formatos proprietários (Kindle/AZW3) — vale a pena?

---

_Este documento evolui conforme o projeto amadurece. Editações e debates bem-vindos._

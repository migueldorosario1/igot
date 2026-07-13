# @igot/parser

Converte arquivos de e-book (EPUB, PDF, MOBI, TXT) numa estrutura comum,
consumida pelo leitor e pelo pipeline de RAG.

## Estrutura comum (esboço)

```typescript
interface ParsedBook {
  title: string;
  author?: string;
  language?: string;
  chapters: Chapter[];
  metadata: Record<string, string>;
}

interface Chapter {
  id: string;
  title?: string;
  // Blocos de conteúdo, preservando a granularidade pra seleção/tradução
  blocks: Block[];
}

interface Block {
  id: string;
  type: 'paragraph' | 'heading' | 'quote' | 'image' | 'list';
  text?: string;
  children?: Block[];
}
```

## Formatos planejados

| Formato | Status | Notas |
|---------|--------|-------|
| **EPUB** | 🚧 primeiro alvo | Estruturado, ideal pra começar |
| **PDF** | 🚧 depois do EPUB | Layout/colunas/imagens adicionam complexidade |
| **TXT** | 🚧 trivial | Bons pra testes |
| **MOBI/AZW3** | 🚧 opcional | Formato legado Kindle |

_Status: ainda não implementado._

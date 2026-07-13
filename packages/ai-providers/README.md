# @igot/ai-providers

Camada de abstração sobre provedores de IA (LLMs e modelos de embedding).

## Filosofia

O igot nunca acopla lógica de negócio a um provedor específico. Toda chamada de
IA passa por aqui. Isso permite:

- Trocar de provedor sem reescrever a aplicação
- Rodar vários provedores em paralelo (ex: comparar traduções)
- Trocar config sem mudar código

## Provedores planejados

| Provedor | Status | Notas |
|----------|--------|-------|
| **Z.ai (GLM)** | 🚧 planejado (padrão MVP) | Contexto longo, multilíngue |
| **DeepSeek** | 🚧 planejado | Custo-benefício, raciocínio |
| **Qwen (Alibaba)** | 🚧 planejado | Tradução, multilíngue |
| **OpenAI** | 🚧 planejado (opcional) | Compatibilidade ampla |
| **Anthropic** | 🚧 planejado (opcional) | Alternativa |

## Interface comum (esboço)

```typescript
interface AIProvider {
  id: string;
  name: string;

  complete(prompt: string, opts?: CompleteOptions): Promise<string>;
  stream?(prompt: string, opts?: CompleteOptions): AsyncIterable<string>;
  embed?(texts: string[]): Promise<number[][]>;
}

interface CompleteOptions {
  systemPrompt?: string;
  context?: string;          // trechos relevantes da obra (RAG)
  temperature?: number;
  maxTokens?: number;
}
```

_Status: ainda não implementado. Este README descreve a intenção._

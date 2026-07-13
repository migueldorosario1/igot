# @igot/ai-providers

Camada de abstração sobre provedores de IA. **Agnóstica de provedor** — o
usuário escolhe qual usar e fornece a própria chave (BYOK).

## Arquitetura

```
config do usuário (localStorage)        adapters                  provedores
┌──────────────────┐     ┌──────────────────────────┐     ┌──────────────────┐
│ { providerId,    │     │ getProvider(config,      │     │ Z.ai (GLM)       │
│   apiKey,        │ ──► │   transport) → AIProvider│ ──► │ OpenAI           │
│   model?,        │     │                          │     │ DeepSeek         │
│   baseUrl? }     │     │ ┌─ OpenAICompatible ────┐│     │ Kimi (Moonshot)  │
└──────────────────┘     │ │  serve 5 dos 6        ││     │ Qwen (Alibaba)   │
                         │ └───────────────────────┘│     │ Anthropic        │
                         │ ┌─ Anthropic ───────────┐│     └──────────────────┘
                         │ │  formato próprio      ││              ▲
                         │ └───────────────────────┘│              │
                         └──────────────┬───────────┘      via Transport
                                        │                  (proxy p/ CORS)
                                        └──────────────────────────┘
```

Três peças:

1. **`Transport`** — como a requisição HTTP viaja. No navegador,
   `createProxyTransport("/api/proxy")` roteia por uma API Route nossa que
   fura o CORS dos provedores. Em código de servidor, `createDirectTransport()`
   faz fetch puro.

2. **Adapters** — implementam `AIProvider`. Dois bastam:
   - `OpenAICompatibleProvider` atende Z.ai, OpenAI, DeepSeek, Kimi, Qwen
     (todos seguem o formato OpenAI: `POST /chat/completions`, `Bearer`, body
     com `model`/`messages`).
   - `AnthropicProvider` tem formato próprio (`POST /messages`, `x-api-key`,
     `system` separado, `max_tokens` obrigatório).

3. **`registry.ts`** — catálogo `PRESETS` (id, nome, baseUrl, modelo padrão,
   adapter, link pra chave) + factory `getProvider(config, transport)`.

## Provedores suportados

| id | Provedor | Adapter | Modelo padrão |
|----|----------|---------|---------------|
| `zai` | Z.ai (GLM) | openai | `glm-4.6` |
| `openai` | OpenAI | openai | `gpt-4o-mini` |
| `deepseek` | DeepSeek | openai | `deepseek-chat` |
| `kimi` | Kimi (Moonshot) | openai | `moonshot-v1-128k` |
| `qwen` | Qwen (Alibaba, DashScope) | openai | `qwen-plus` |
| `anthropic` | Anthropic | anthropic | `claude-3-5-haiku-latest` |

## Uso

```typescript
import { getProvider, createProxyTransport, PRESETS } from "@igot/ai-providers";

// config do usuário (vem do localStorage na UI)
const config = {
  providerId: "deepseek",
  apiKey: "sk-...",
};

const transport = createProxyTransport("/api/proxy");
const provider = getProvider(config, transport);

const result = await provider.complete("Traduza: hello", {
  systemPrompt: "Seja um tradutor.",
  temperature: 0.3,
});
console.log(result.text);   // "olá"
console.log(result.usage);  // { promptTokens, completionTokens, totalTokens }
```

## Como adicionar um novo provedor

**Se for OpenAI-compatible** (a maioria dos LLMs como serviço hoje em dia):
basta adicionar um item a `PRESETS` em `registry.ts` — sem código novo.

```typescript
{
  id: "novo",
  name: "Novo Provedor",
  baseUrl: "https://api.novo.com/v1",
  defaultModel: "novo-1",
  adapter: "openai",
  keyUrl: "https://...",
}
```

**Se o protocolo for diferente**: crie um adapter em `src/providers/` que
implemente `AIProvider`, adicione um `AdapterKind` em `types.ts`, e trate-o
no `switch` de `getProvider`. Depois registre o preset.

## Princípios

- **Nunca acoplar** lógica de negócio a um provedor específico. Tudo passa
  por `AIProvider`.
- **A chave é do usuário** (BYOK), guardada no navegador. O pacote não lê
  `process.env`; quem o consome passa a config explicitamente.
- **Erros padronizados** via `AIProviderError` (com `providerId` e
  `statusCode` quando aplicável).

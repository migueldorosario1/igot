/**
 * Adapter genérico para provedores compatíveis com a API da OpenAI.
 *
 * Serve para: Z.ai (GLM), OpenAI, DeepSeek, Kimi (Moonshot), Qwen (DashScope
 * em modo compatível). Todos seguem o mesmo contrato:
 *
 *   POST {baseUrl}/chat/completions
 *   Authorization: Bearer <apiKey>
 *   { model, messages: [{role, content}], temperature, max_tokens }
 *
 * As diferenças (endpoint base, modelo padrão) vêm no `OpenAICompatibleConfig`.
 * A requisição em si roteia por `transport` — no navegador, via proxy.
 */

import type {
  AIProvider,
  CompleteOptions,
  CompleteResult,
} from "../types";
import { AIProviderError } from "../types";
import type { Transport } from "../transport";

export interface OpenAICompatibleConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message: string; code?: string | number };
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly id: string;
  readonly name: string;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly transport: Transport;

  constructor(config: OpenAICompatibleConfig, transport: Transport) {
    if (!config.apiKey) {
      throw new AIProviderError(
        `Chave de API ausente para o provedor "${config.name}".`,
        config.id,
      );
    }
    this.id = config.id;
    this.name = config.name;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
    this.transport = transport;
  }

  async complete(
    prompt: string,
    opts: CompleteOptions = {},
  ): Promise<CompleteResult> {
    const model = opts.model ?? this.defaultModel;
    const messages = this.buildMessages(prompt, opts);

    const { status, body } = await this.transport.request(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.3,
          ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
        }),
      },
    );

    if (status >= 400) {
      const errBody = body as ChatResponse | undefined;
      const detail = errBody?.error?.message ?? "";
      throw new AIProviderError(
        `${this.name} respondeu ${status}${detail ? `: ${detail}` : ""}`,
        this.id,
        status,
      );
    }

    const data = body as ChatResponse;
    if (data.error) {
      throw new AIProviderError(
        `${this.name} retornou erro: ${data.error.message}`,
        this.id,
      );
    }

    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return {
      text,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Streaming: yields do texto aos poucos (token a token).
   *
   * O provedor envia SSE (Server-Sent Events): linhas `data: {json}` terminadas
   * por `\n\n`. Cada JSON tem `choices[0].delta.content` com o pedaço do texto.
   * Última linha é `data: [DONE]`.
   */
  async *stream(
    prompt: string,
    opts: CompleteOptions = {},
  ): AsyncIterable<string> {
    if (!this.transport.stream) {
      // Sem suporte a stream no transport — cai pro complete e devolve tudo.
      const result = await this.complete(prompt, opts);
      yield result.text;
      return;
    }

    const model = opts.model ?? this.defaultModel;
    const messages = this.buildMessages(prompt, opts);

    const res = await this.transport.stream(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.3,
          ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
          stream: true, // habilita SSE
        }),
      },
    );

    if (!res.body) throw new AIProviderError("Stream sem body.", this.id);

    // Lê o stream SSE linha a linha.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Processa linhas completas (terminadas por \n).
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // última linha incompleta fica no buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") return;
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
              error?: { message?: string };
            };
            if (parsed.error) {
              throw new AIProviderError(
                `${this.name} erro: ${parsed.error.message}`,
                this.id,
              );
            }
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) yield chunk;
          } catch (err) {
            // JSON parcial/inválido num chunk — ignora silenciosamente.
            if (err instanceof AIProviderError) throw err;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /** Monta as mensagens no formato chat. Contexto é anexado ao turno do usuário. */
  private buildMessages(prompt: string, opts: CompleteOptions): ChatMessage[] {
    const messages: ChatMessage[] = [];
    if (opts.systemPrompt) {
      messages.push({ role: "system", content: opts.systemPrompt });
    }
    const userContent = opts.context
      ? `${prompt}\n\n---\n[CONTEXTO DE REFERÊNCIA]\n${opts.context}`
      : prompt;
    messages.push({ role: "user", content: userContent });
    return messages;
  }
}

/**
 * Adapter do provedor Z.ai (GLM).
 *
 * A Z.ai expõe uma API de chat completions compatível com o formato OpenAI:
 *   POST https://api.z.ai/api/paas/v4/chat/completions
 *
 * A chave DEVE ficar no servidor (API Routes / variável de ambiente).
 * Nunca exponha ZAI_API_KEY no navegador.
 */

import type { AIProvider, CompleteOptions, CompleteResult } from "../types";
import { AIProviderError } from "../types";

/** Config para instanciar o provider Z.ai. */
export interface ZAIConfig {
  /** Chave de API (lida de process.env no servidor). */
  apiKey: string;
  /** Endpoint base. Padrão: API pública da Z.ai. */
  baseUrl?: string;
  /** Modelo padrão. */
  model?: string;
}

const DEFAULT_BASE_URL = "https://api.z.ai/api/paas/v4";
const DEFAULT_MODEL = "glm-4.6";

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{
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

export class ZAIProvider implements AIProvider {
  readonly id = "zai";
  readonly name = "Z.ai (GLM)";

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(config: ZAIConfig) {
    if (!config.apiKey) {
      throw new AIProviderError(
        "ZAI_API_KEY não configurada.",
        "zai",
      );
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.defaultModel = config.model ?? DEFAULT_MODEL;
  }

  async complete(
    prompt: string,
    opts: CompleteOptions = {},
  ): Promise<CompleteResult> {
    const model = opts.model ?? this.defaultModel;
    const messages = this.buildMessages(prompt, opts);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.3,
          max_tokens: opts.maxTokens,
        }),
      });
    } catch (err) {
      throw new AIProviderError(
        `Falha de rede ao contatar Z.ai: ${String(err)}`,
        "zai",
        undefined,
        err,
      );
    }

    if (!res.ok) {
      let detail = "";
      try {
        const errBody = (await res.json()) as OpenAIChatResponse;
        detail = errBody.error?.message ?? "";
      } catch {
        /* ignora corpo inválido */
      }
      throw new AIProviderError(
        `Z.ai respondeu ${res.status}${detail ? `: ${detail}` : ""}`,
        "zai",
        res.status,
      );
    }

    let body: OpenAIChatResponse;
    try {
      body = (await res.json()) as OpenAIChatResponse;
    } catch (err) {
      throw new AIProviderError(
        "Resposta da Z.ai não era JSON válido.",
        "zai",
        res.status,
        err,
      );
    }

    if (body.error) {
      throw new AIProviderError(
        `Z.ai retornou erro: ${body.error.message}`,
        "zai",
        undefined,
      );
    }

    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    return {
      text,
      usage: body.usage
        ? {
            promptTokens: body.usage.prompt_tokens,
            completionTokens: body.usage.completion_tokens,
            totalTokens: body.usage.total_tokens,
          }
        : undefined,
    };
  }

  /** Monta a lista de mensagens no formato chat. */
  private buildMessages(
    prompt: string,
    opts: CompleteOptions,
  ): OpenAIChatMessage[] {
    const messages: OpenAIChatMessage[] = [];

    if (opts.systemPrompt) {
      messages.push({ role: "system", content: opts.systemPrompt });
    }

    // Se houver contexto (trechos da obra), anexamos ao turno do usuário
    // — fica explícito que é material de referência, não instrução.
    const userContent = opts.context
      ? `${prompt}\n\n---\n[CONTEXTO DE REFERÊNCIA]\n${opts.context}`
      : prompt;

    messages.push({ role: "user", content: userContent });
    return messages;
  }
}

/**
 * Adapter do provedor Google Gemini (Google AI / Generative Language API).
 *
 * Formato próprio — diferente de OpenAI e de Anthropic:
 *
 *   POST {baseUrl}/models/{model}:generateContent
 *   x-goog-api-key: <apiKey>          (não é Bearer, nem x-api-key)
 *   Content-Type: application/json
 *   {
 *     systemInstruction?: { parts: [{ text }] },
 *     contents: [{ role: "user"|"model", parts: [{ text }] }],
 *     generationConfig?: { temperature, maxOutputTokens }
 *   }
 *
 * Particularidades:
 * - O modelo vai NO PATH da URL (não no body). O baseUrl do preset cobre
 *   apenas até a versão (ex.: https://generativelanguage.googleapis.com/v1beta).
 * - O papel do assistente se chama "model" (não "assistant").
 * - Resposta: { candidates: [{ content: { parts: [{text}] } }], usageMetadata }
 */

import type {
  AIProvider,
  CompleteOptions,
  CompleteResult,
} from "../types";
import { AIProviderError } from "../types";
import type { Transport } from "../transport";

export interface GeminiConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[]; role?: string };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message: string; code?: number; status?: string };
}

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly name: string;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly transport: Transport;

  constructor(config: GeminiConfig, transport: Transport) {
    if (!config.apiKey) {
      throw new AIProviderError(
        "Chave de API do Gemini ausente.",
        "gemini",
      );
    }
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

    // Contexto é anexado ao prompt do usuário (mesma convenção dos demais adapters).
    const userText = opts.context
      ? `${prompt}\n\n---\n[CONTEXTO DE REFERÊNCIA]\n${opts.context}`
      : prompt;

    const contents: GeminiContent[] = [
      { role: "user", parts: [{ text: userText }] },
    ];

    const body: Record<string, unknown> = { contents };
    if (opts.systemPrompt) {
      body.systemInstruction = { parts: [{ text: opts.systemPrompt }] };
    }
    if (opts.temperature !== undefined || opts.maxTokens !== undefined) {
      body.generationConfig = {
        ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
        ...(opts.maxTokens !== undefined ? { maxOutputTokens: opts.maxTokens } : {}),
      };
    }

    const { status, body: respBody } = await this.transport.request(
      // Modelo vai no path; auth no header (não na query string).
      `${this.baseUrl}/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify(body),
      },
    );

    if (status >= 400) {
      const errBody = respBody as GeminiResponse | undefined;
      const detail = errBody?.error?.message ?? "";
      throw new AIProviderError(
        `Gemini respondeu ${status}${detail ? `: ${detail}` : ""}`,
        this.id,
        status,
      );
    }

    const data = respBody as GeminiResponse;
    if (data.error) {
      throw new AIProviderError(
        `Gemini retornou erro: ${data.error.message}`,
        this.id,
      );
    }

    // Concatena os parts de texto de todos os candidates (há normalmente um).
    const text =
      data.candidates
        ?.flatMap((c) => c.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";

    return {
      text,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }
}

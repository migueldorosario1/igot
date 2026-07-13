/**
 * Ponto de entrada do pacote @igot/ai-providers.
 *
 * Exporta a interface comum e os adapters de cada provedor.
 * Importe SEMPRE daqui — nunca direto de um provider específico.
 */

import type { AIProvider } from "./types";
import { AIProviderError } from "./types";
import { ZAIProvider } from "./providers/zai";

export type { AIProvider, CompleteOptions, CompleteResult } from "./types";
export { AIProviderError } from "./types";
export { ZAIProvider } from "./providers/zai";
export type { ZAIConfig } from "./providers/zai";

/**
 * Fábrica do provedor padrão da aplicação (lê config do ambiente no servidor).
 *
 * Use SOMENTE em código que roda no servidor (API Routes, Server Components).
 * No navegador, chame sempre via /api/* — a chave nunca cruza a fronteira.
 */
export function getDefaultProvider(): AIProvider {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    throw new AIProviderError(
      "ZAI_API_KEY ausente nas variáveis de ambiente do servidor.",
      "zai",
    );
  }
  return new ZAIProvider({
    apiKey,
    model: process.env.ZAI_MODEL, // opcional; cai pro padrão (glm-4.6)
  });
}

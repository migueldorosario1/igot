/**
 * Cliente de IA de alto nível (roda no navegador).
 *
 * Lê a config do usuário (localStorage), instancia o provider com o transport
 * proxy (fura CORS), e expõe as três ações da UI: traduzir, explicar, perguntar.
 *
 * Esta é a lógica de prompt que antes morava nas API Routes — agora no cliente,
 * já que o servidor não detém mais a chave.
 */

import {
  getProvider,
  createProxyTransport,
  AIProviderError,
  ProxyStreamError,
  type AIConfig,
} from "@igot/ai-providers";
import { getConfig, getTargetLang } from "./config";
import { t } from "./messages";

/** Contexto da obra relevante para as ações. */
export interface BookContext {
  bookTitle?: string;
  bookAuthor?: string;
  bookLanguage?: string;
}

/** Resultado padronizado das ações. */
export interface AIActionResult {
  ok: boolean;
  text?: string;
  error?: string;
}

/** Callback chamado a cada pedaço de texto que chega (pra streaming). */
export type StreamCallback = (fullText: string, chunk: string) => void;

/** Monta o bloco de contexto (metadados da obra) que acompanha o prompt. */
function buildContext(ctx: BookContext): string | undefined {
  const parts = [
    ctx.bookTitle && `Obra: ${ctx.bookTitle}`,
    ctx.bookAuthor && `Autor: ${ctx.bookAuthor}`,
    ctx.bookLanguage && `Idioma original: ${ctx.bookLanguage}`,
  ].filter(Boolean);
  return parts.length ? parts.join("\n") : undefined;
}

/** Instancia o provider a partir da config do usuário (ou lança erro legível). */
function resolveProvider() {
  const config = getConfig();
  if (!config) {
    throw new Error(
      "IA não configurada. Abra Configurações e escolha um provedor.",
    );
  }
  const transport = createProxyTransport("/api/proxy");
  return { provider: getProvider(config as AIConfig, transport), config };
}

/**
 * Converte qualquer exceção numa mensagem amigável no IDIOMA DO USUÁRIO.
 * Traduz status HTTP comuns dos provedores de IA em texto claro, com a
 * próxima ação. O idioma acompanha o que o usuário configurou (targetLang):
 * configurou em inglês? vê erros em inglês. Português? em português.
 */
function toMessage(err: unknown): string {
  const lang = getTargetLang();

  // Erro do proxy-stream com status HTTP do provedor.
  if (err instanceof ProxyStreamError) {
    const detail = err.providerDetail ? ` (${err.providerDetail})` : "";
    switch (err.statusCode) {
      case 401:
      case 403:
        return t(lang, "errAuth") + detail;
      case 429:
        return t(lang, "errRateLimit") + detail;
      case 500:
      case 502:
      case 503:
        return t(lang, "errServer") + detail;
      default:
        return t(lang, "errGeneric", { code: err.statusCode }) + detail;
    }
  }
  if (err instanceof AIProviderError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}

// ─── Ações ──────────────────────────────────────────────────────────────

/** Traduz um trecho para o idioma-alvo do usuário. */
export async function translate(
  text: string,
  ctx: BookContext,
): Promise<AIActionResult> {
  if (!text.trim()) return { ok: false, error: "Texto ausente." };
  const targetLang = getTargetLang();
  const systemPrompt =
    `Você é um tradutor literário e técnico de excelência. ` +
    `Traduza o trecho fornecido para ${targetLang}. ` +
    `Respeite o tom, o estilo e o contexto da obra. ` +
    `Devolva APENAS a tradução, sem comentários, sem aspas, sem introdução.`;

  try {
    const { provider } = resolveProvider();
    const result = await provider.complete(text, {
      systemPrompt,
      context: buildContext(ctx),
      temperature: 0.3,
    });
    return { ok: true, text: result.text };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

/**
 * Versão STREAMING de translate: o texto vai aparecendo aos poucos.
 * `onChunk` é chamado a cada pedaço (com o texto acumulado + o pedaço novo).
 * Cai pra `translate` (sem stream) se o provedor não suportar.
 */
export async function translateStream(
  text: string,
  ctx: BookContext,
  onChunk: StreamCallback,
): Promise<AIActionResult> {
  if (!text.trim()) return { ok: false, error: "Texto ausente." };
  const targetLang = getTargetLang();
  const systemPrompt =
    `Você é um tradutor literário e técnico de excelência. ` +
    `Traduza o trecho fornecido para ${targetLang}. ` +
    `Respeite o tom, o estilo e o contexto da obra. ` +
    `Devolva APENAS a tradução, sem comentários, sem aspas, sem introdução.`;

  try {
    const { provider } = resolveProvider();
    if (!provider.stream) {
      // Sem suporte a stream — faz normal e devolve de uma vez.
      const result = await provider.complete(text, {
        systemPrompt,
        context: buildContext(ctx),
        temperature: 0.3,
      });
      onChunk(result.text, result.text);
      return { ok: true, text: result.text };
    }
    let full = "";
    for await (const chunk of provider.stream(text, {
      systemPrompt,
      context: buildContext(ctx),
      temperature: 0.3,
    })) {
      full += chunk;
      onChunk(full, chunk);
    }
    return { ok: true, text: full };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

/**
 * Traduz a página/capítulo INTEIRO de uma vez.
 *
 * Diferente do `translate` (trecho curto), aqui o texto é longo. O prompt
 * pede parágrafos coerentes e bem separados — porque PDFs costumam ter
 * quebras de linha artificiais (uma por linha impressa) que, preservadas
 * à risca, geram um texto bagunçado. Ao reagrupar em parágrafos naturais,
 * a tradução flui como uma página de livro real, legível e bonita.
 */
export async function translatePage(
  text: string,
  ctx: BookContext,
): Promise<AIActionResult> {
  if (!text.trim()) return { ok: false, error: "Página sem texto para traduzir." };
  const targetLang = getTargetLang();
  const systemPrompt =
    `Você é um tradutor literário e técnico de excelência. ` +
    `Traduza o texto completo da página a seguir para ${targetLang}. ` +
    `Reagrupe o conteúdo em PARÁGRAFOS coerentes e naturais: ` +
    `uma mudança de ideia = novo parágrafo. ` +
    `Ignore as quebras de linha artificiais do original (PDFs quebram a cada ` +
    `linha impressa) e crie parágrafos que fluam como uma página de livro. ` +
    `Mantenha títulos/heading em linhas próprias. ` +
    `Separe cada parágrafo por UMA linha em branco. ` +
    `Respeite o tom, o estilo e o contexto da obra. ` +
    `Devolva APENAS a tradução, sem comentários, sem aspas, sem introdução.`;

  try {
    const { provider } = resolveProvider();
    const result = await provider.complete(text, {
      systemPrompt,
      context: buildContext(ctx),
      temperature: 0.3,
    });
    return { ok: true, text: result.text };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

/**
 * Versão STREAMING de translatePage: a tradução da página inteira vai
 * aparecendo aos poucos (palavra por palavra). `onChunk` recebe o texto
 * acumulado + o pedaço novo a cada chunk do LLM.
 */
export async function translatePageStream(
  text: string,
  ctx: BookContext,
  onChunk: StreamCallback,
): Promise<AIActionResult> {
  if (!text.trim()) return { ok: false, error: "Página sem texto para traduzir." };
  const targetLang = getTargetLang();
  const systemPrompt =
    `Você é um tradutor literário e técnico de excelência. ` +
    `Traduza o texto completo da página a seguir para ${targetLang}. ` +
    `Reagrupe o conteúdo em PARÁGRAFOS coerentes e naturais: ` +
    `uma mudança de ideia = novo parágrafo. ` +
    `Ignore as quebras de linha artificiais do original (PDFs quebram a cada ` +
    `linha impressa) e crie parágrafos que fluam como uma página de livro. ` +
    `Mantenha títulos/heading em linhas próprias. ` +
    `Separe cada parágrafo por UMA linha em branco. ` +
    `Respeite o tom, o estilo e o contexto da obra. ` +
    `Devolva APENAS a tradução, sem comentários, sem aspas, sem introdução.`;

  try {
    const { provider } = resolveProvider();
    if (!provider.stream) {
      const result = await provider.complete(text, {
        systemPrompt,
        context: buildContext(ctx),
        temperature: 0.3,
      });
      onChunk(result.text, result.text);
      return { ok: true, text: result.text };
    }
    let full = "";
    for await (const chunk of provider.stream(text, {
      systemPrompt,
      context: buildContext(ctx),
      temperature: 0.3,
    })) {
      full += chunk;
      onChunk(full, chunk);
    }
    return { ok: true, text: full };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

/** Explica um trecho (sentido, idiotismos, contexto). */
export async function explain(
  text: string,
  ctx: BookContext,
): Promise<AIActionResult> {
  if (!text.trim()) return { ok: false, error: "Texto ausente." };
  const targetLang = getTargetLang();
  const systemPrompt =
    `Você é um assistente de leitura. Explique o trecho fornecido em ${targetLang}, ` +
    `de forma clara e didática. ` +
    `Cubra: sentido literal, possíveis sentidos figurados, idiotismos ou ` +
    `referências culturais, e como ele se encaixa no contexto da obra. ` +
    `Seja conciso (2 a 4 parágrafos curtos). ` +
    `Não invente — se não souber algo, diga.`;

  try {
    const { provider } = resolveProvider();
    const result = await provider.complete(
      `Explique este trecho:\n\n"${text}"`,
      {
        systemPrompt,
        context: buildContext(ctx),
        temperature: 0.4,
      },
    );
    return { ok: true, text: result.text };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

/** Versão STREAMING de explain. */
export async function explainStream(
  text: string,
  ctx: BookContext,
  onChunk: StreamCallback,
): Promise<AIActionResult> {
  if (!text.trim()) return { ok: false, error: "Texto ausente." };
  const targetLang = getTargetLang();
  const systemPrompt =
    `Você é um assistente de leitura. Explique o trecho fornecido em ${targetLang}, ` +
    `de forma clara e didática. ` +
    `Cubra: sentido literal, possíveis sentidos figurados, idiotismos ou ` +
    `referências culturais, e como ele se encaixa no contexto da obra. ` +
    `Seja conciso (2 a 4 parágrafos curtos). ` +
    `Não invente — se não souber algo, diga.`;

  try {
    const { provider } = resolveProvider();
    if (!provider.stream) {
      const result = await provider.complete(`Explique este trecho:\n\n"${text}"`, {
        systemPrompt,
        context: buildContext(ctx),
        temperature: 0.4,
      });
      onChunk(result.text, result.text);
      return { ok: true, text: result.text };
    }
    let full = "";
    for await (const chunk of provider.stream(`Explique este trecho:\n\n"${text}"`, {
      systemPrompt,
      context: buildContext(ctx),
      temperature: 0.4,
    })) {
      full += chunk;
      onChunk(full, chunk);
    }
    return { ok: true, text: full };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

/** Responde uma pergunta livre sobre o livro (preview do Q&A — sem RAG ainda). */
export async function ask(
  question: string,
  ctx: BookContext,
): Promise<AIActionResult> {
  if (!question.trim()) return { ok: false, error: "Pergunta ausente." };
  const targetLang = getTargetLang();
  const systemPrompt =
    `Você é um assistente de leitura ajudando alguém com o livro "${ctx.bookTitle ?? "desconhecido"}". ` +
    `Responda em ${targetLang}, de forma útil e honesta. ` +
    `Se não souber algo por falta de contexto do texto, diga — não invente. ` +
    `(Em breve: respostas fundamentadas no texto da obra.)`;

  try {
    const { provider } = resolveProvider();
    const result = await provider.complete(question, {
      systemPrompt,
      context: buildContext(ctx),
      temperature: 0.4,
    });
    return { ok: true, text: result.text };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

/**
 * Teste de conexão: faz uma chamada mínima ao provider escolhido.
 * Usado pela tela de Configurações pra validar chave + provedor.
 */
export async function testConnection(
  config: AIConfig,
): Promise<{ ok: boolean; message: string }> {
  try {
    const transport = createProxyTransport("/api/proxy");
    const provider = getProvider(config, transport);
    const result = await provider.complete("Diga apenas: OK", {
      temperature: 0,
      maxTokens: 16,
    });
    return {
      ok: true,
      message: `Conexão bem-sucedida. Resposta: "${result.text.slice(0, 40)}"`,
    };
  } catch (err) {
    return { ok: false, message: toMessage(err) };
  }
}

/**
 * POST /api/explain
 *
 * Recebe um trecho e devolve uma explicação (no idioma do leitor) do que
 * aquele trecho significa, considerando o contexto da obra.
 */

import { NextResponse } from "next/server";
import { getDefaultProvider, AIProviderError } from "@igot/ai-providers";

interface ExplainBody {
  text: string;
  targetLang: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookLanguage?: string;
}

export async function POST(req: Request) {
  let body: ExplainBody;
  try {
    body = (await req.json()) as ExplainBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const { text, targetLang, bookTitle, bookAuthor, bookLanguage } = body;

  if (!text || !text.trim()) {
    return NextResponse.json(
      { ok: false, error: "Texto ausente." },
      { status: 400 },
    );
  }

  const systemPrompt =
    `Você é um assistente de leitura. Explique o trecho fornecido em ${targetLang}, ` +
    `de forma clara e didática. ` +
    `Cubra: sentido literal, possíveis sentidos figurados, idiotismos ou ` +
    `referências culturais, e como ele se encaixa no contexto da obra. ` +
    `Seja conciso (2 a 4 parágrafos curtos). ` +
    `Não invente — se não souber algo, diga.`;

  const context = [
    bookTitle && `Obra: ${bookTitle}`,
    bookAuthor && `Autor: ${bookAuthor}`,
    bookLanguage && `Idioma original: ${bookLanguage}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const provider = getDefaultProvider();
    const result = await provider.complete(
      `Explique este trecho:\n\n"${text}"`,
      {
        systemPrompt,
        context: context || undefined,
        temperature: 0.4,
      },
    );
    return NextResponse.json({ ok: true, text: result.text });
  } catch (err) {
    const message =
      err instanceof AIProviderError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Erro interno.";
    const status = err instanceof AIProviderError && err.statusCode ? err.statusCode : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

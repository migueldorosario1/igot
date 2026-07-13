/**
 * POST /api/translate
 *
 * Recebe um trecho e devolve a tradução contextualizada pela obra.
 * Roda no servidor — usa a chave ZAI_API_KEY (nunca exposta ao browser).
 */

import { NextResponse } from "next/server";
import { getDefaultProvider, AIProviderError } from "@igot/ai-providers";

interface TranslateBody {
  text: string;
  targetLang: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookLanguage?: string;
}

export async function POST(req: Request) {
  let body: TranslateBody;
  try {
    body = (await req.json()) as TranslateBody;
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

  // System prompt: papel do tradutor + restrição de qualidade.
  const systemPrompt =
    `Você é um tradutor literário e técnico de excelência. ` +
    `Traduza o trecho fornecido para ${targetLang}. ` +
    `Respeite o tom, o estilo e o contexto da obra. ` +
    `Devolva APENAS a tradução, sem comentários, sem aspas, sem introdução.`;

  // Contexto da obra ajuda a escolher o sentido certo (ex.: "bank" = margem vs banco).
  const context = [
    bookTitle && `Obra: ${bookTitle}`,
    bookAuthor && `Autor: ${bookAuthor}`,
    bookLanguage && `Idioma original: ${bookLanguage}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const provider = getDefaultProvider();
    const result = await provider.complete(text, {
      systemPrompt,
      context: context || undefined,
      temperature: 0.3,
    });
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

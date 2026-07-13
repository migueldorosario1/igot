/**
 * POST /api/ask
 *
 * Pergunta livre sobre o livro (preview do Q&A da Fase 2).
 *
 * IMPORTANTE: nesta fase (MVP) ainda NÃO há RAG — a IA responde só com
 * o que sabe + título/autor. Em breve a Fase 2 injeta trechos da obra
 * (grounding real) via packages/rag.
 */

import { NextResponse } from "next/server";
import { getDefaultProvider, AIProviderError } from "@igot/ai-providers";

interface AskBody {
  question: string;
  targetLang?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookLanguage?: string;
}

export async function POST(req: Request) {
  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const { question, targetLang = "pt-BR", bookTitle, bookAuthor, bookLanguage } = body;

  if (!question || !question.trim()) {
    return NextResponse.json(
      { ok: false, error: "Pergunta ausente." },
      { status: 400 },
    );
  }

  const systemPrompt =
    `Você é um assistente de leitura ajudando alguém com o livro "${bookTitle ?? "desconhecido"}". ` +
    `Responda em ${targetLang}, de forma útil e honesta. ` +
    `Se não souber algo por falta de contexto do texto, diga — não invente. ` +
    `(Em breve: respostas fundamentadas no texto da obra.)`;

  const context = [
    bookTitle && `Obra: ${bookTitle}`,
    bookAuthor && `Autor: ${bookAuthor}`,
    bookLanguage && `Idioma original: ${bookLanguage}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const provider = getDefaultProvider();
    const result = await provider.complete(question, {
      systemPrompt,
      context: context || undefined,
      temperature: 0.4,
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

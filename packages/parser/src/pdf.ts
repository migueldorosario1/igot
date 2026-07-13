/**
 * Parser de PDF.
 *
 * PDF é mais difícil que EPUB: não há estrutura semântica garantida.
 * A estratégia aqui é extrair texto por página, agrupar linhas em
 * parágrafos (heurística por espaçamento), e mapear cada página a um
 * "capítulo" (capítulo = página no MVP; depois podemos detectar TOC).
 *
 * Usa pdfjs-dist (Mozilla) que roda tanto no navegador quanto em Node.
 */

import type { Block, Chapter, ParsedBook } from "./types";

interface PDFParseInput {
  /** Conteúdo do arquivo .pdf. */
  data: ArrayBuffer;
  /** Nome do arquivo (fallback de título). */
  fileName?: string;
}

/**
 * Faz o parse de um PDF.
 *
 * @param input buffer + nome do arquivo
 * @returns ParsedBook com uma página por capítulo.
 */
export async function parsePDF(input: PDFParseInput): Promise<ParsedBook> {
  // Import dinâmico: pdfjs é pesado e tem entrypoints diferentes por ambiente.
  const pdfjs: typeof import("pdfjs-dist") = await import("pdfjs-dist");

  // Worker no navegador vem do CDN da Mozilla, na mesma versão do pacote.
  // (Montar a URL via require ?url não é type-safe nem portátil; usar o CDN
  // na versão exata evita mismatch de versão entre API e worker.)
  const isBrowser = typeof window !== "undefined";
  if (isBrowser) {
    const version = pdfjs.version;
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(input.data),
    // Em Node, desativa o worker (não há DOM Workers).
    ...(isBrowser ? {} : { useWorkerFetch: false, isEvalSupported: false }),
  });

  const doc = await loadingTask.promise;
  const chapters: Chapter[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    // Agrupa itens de texto em linhas pela coordenada Y (transform).
    const lines = groupItemsIntoLines(content.items);
    const paragraphs = linesToParagraphs(lines);

    const blocks: Block[] = paragraphs
      .filter((p) => p.trim().length > 0)
      .map((text, i) => ({
        id: `p${pageNum}-b${i}`,
        type: "paragraph" as const,
        text: text.trim(),
      }));

    if (blocks.length > 0) {
      chapters.push({
        id: `p${pageNum}`,
        title: `Página ${pageNum}`,
        blocks,
      });
    }
  }

  // Metadados do PDF (title/author podem existir embutidos).
  let metadata: Record<string, string> = {};
  try {
    const meta = await doc.getMetadata();
    if (meta?.info) {
      const info = meta.info as Record<string, unknown>;
      const title = info["Title"];
      const author = info["Author"];
      if (typeof title === "string" && title) metadata.title = title;
      if (typeof author === "string" && author) metadata.author = author;
    }
  } catch {
    /* metadados são best-effort */
  }

  await doc.destroy();

  return {
    title: metadata.title || input.fileName?.replace(/\.pdf$/i, "") || "Sem título",
    author: metadata.author,
    sourceFormat: "pdf",
    chapters,
    metadata,
  };
}

// ----------------------------------------------------------------------------
// Helpers: agrupamento de itens de texto do pdf.js em parágrafos
// ----------------------------------------------------------------------------

interface TextLine {
  y: number;
  parts: { x: number; text: string }[];
}

type PdfTextItem = {
  str: string;
  transform: number[]; // [a,b,c,d,e,f] — e=x, f=y
  hasEOL?: boolean;
  width?: number;
  height?: number;
};

/**
 * Agrupa itens de texto que compartilham (aproximadamente) a mesma linha Y.
 */
function groupItemsIntoLines(rawItems: unknown): TextLine[] {
  const items = rawItems as PdfTextItem[];
  const lines: TextLine[] = [];

  for (const it of items) {
    if (!it.str) continue;
    const x = it.transform?.[4] ?? 0;
    const y = it.transform?.[5] ?? 0;

    // Procura linha existente com Y parecido (tolerância proporcional à altura).
    const height = it.height ?? Math.abs(it.transform?.[3] ?? 10);
    const tol = Math.max(3, height * 0.5);
    let line = lines.find((l) => Math.abs(l.y - y) <= tol);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x, text: it.str });
  }

  // Ordena linhas de cima pra baixo (Y decrescente no espaço PDF).
  lines.sort((a, b) => b.y - a.y);
  // Ordena partes de cada linha pela esquerda-direita.
  for (const l of lines) l.parts.sort((a, b) => a.x - b.x);

  return lines;
}

/**
 * Junta linhas em parágrafos.
 * Heurística: quebra parágrafo quando há uma linha em branco (EOL duplo)
 * ou um salto vertical grande entre linhas consecutivas.
 */
function linesToParagraphs(lines: TextLine[]): string[] {
  const paragraphs: string[] = [];
  let current = "";
  let prevY: number | null = null;

  for (const line of lines) {
    const text = line.parts.map((p) => p.text).join("").trim();
    if (!text) {
      // linha vazia = fim de parágrafo
      if (current) {
        paragraphs.push(current);
        current = "";
      }
      prevY = null;
      continue;
    }

    // Salto vertical grande entre linhas consecutivas → novo parágrafo.
    if (prevY !== null) {
      const gap = prevY - line.y;
      if (gap > 16) {
        if (current) {
          paragraphs.push(current);
          current = "";
        }
      }
    }

    current = current ? `${current} ${text}` : text;
    prevY = line.y;
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

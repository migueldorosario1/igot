/**
 * Parser de EPUB.
 *
 * EPUB é essencialmente um ZIP com arquivos (X)HTML por capítulo.
 * O fluxo:
 *   1. Descompacta o buffer (JSZip no navegador / Node)
 *   2. Lê o OPF (metadata + spine = ordem de leitura)
 *   3. Para cada item do spine, extrai texto dos (X)HTML
 *   4. Monta `ParsedBook`
 *
 * Esta implementação roda no navegador (JSZip + DOMParser nativo),
 * mas é facilmente portável pra Node com unzipper/cheerio.
 */

import JSZip from "jszip";
import type { Block, Chapter, ParsedBook } from "./types";

interface EPUBParseInput {
  /** Conteúdo do arquivo .epub. */
  data: ArrayBuffer;
  /** Nome do arquivo (só pra fallback de título). */
  fileName?: string;
}

/**
 * Faz o parse de um EPUB.
 * Dependências: "jszip" e o DOMParser nativo do navegador.
 */
export async function parseEPUB(input: EPUBParseInput): Promise<ParsedBook> {
  const zip = await JSZip.loadAsync(input.data);

  // --- 1. Localizar o container.xml para achar o OPF raiz ---
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) {
    throw new Error("EPUB inválido: container.xml ausente.");
  }
  const opfPath = extractOPFPath(containerXml);
  if (!opfPath) {
    throw new Error("EPUB inválido: rootfile OPF não encontrado.");
  }

  const opfXml = await zip.file(opfPath)?.async("string");
  if (!opfXml) {
    throw new Error(`EPUB inválido: OPF "${opfPath}" não encontrado.`);
  }
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  // --- 2. Parse do OPF (com DOMParser) ---
  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfXml, "application/xhtml+xml");

  const metadata = extractOPFMetadata(opfDoc);
  const { manifest, manifestByHref } = buildManifest(opfDoc, opfDir);
  const spineItemrefs = Array.from(opfDoc.getElementsByTagNameNS("*", "itemref"));

  // --- 3. Para cada item do spine, extrair blocos ---
  const chapters: Chapter[] = [];
  let chapIdx = 0;
  for (const itemref of spineItemrefs) {
    const idref = itemref.getAttribute("idref");
    if (!idref || !manifest[idref]) continue;

    const item = manifest[idref];
    if (!item.mediaType.includes("html") && !item.href.endsWith(".html") && !item.href.endsWith(".xhtml")) {
      continue;
    }

    const html = await zip.file(item.zipPath)?.async("string");
    if (!html) continue;

    const doc = parser.parseFromString(html, "application/xhtml+xml");
    const blocks = extractBlocks(doc, `ch${chapIdx}`);

    // Título do capítulo = primeiro heading, ou vazio
    const firstHeading = blocks.find((b) => b.type === "heading");
    chapters.push({
      id: `ch${chapIdx}`,
      title: firstHeading?.text,
      blocks,
    });
    chapIdx++;
  }

  return {
    title: metadata.title || input.fileName?.replace(/\.epub$/i, "") || "Sem título",
    author: metadata.author,
    language: metadata.language,
    sourceFormat: "epub",
    chapters,
    metadata,
  };
}

// ----------------------------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------------------------

function extractOPFPath(containerXml: string): string | null {
  const match = containerXml.match(/full-path="([^"]+)"/);
  return match ? match[1] : null;
}

function extractOPFMetadata(opfDoc: Document): Record<string, string> {
  const get = (tag: string): string | undefined => {
    const el = opfDoc.getElementsByTagNameNS("*", tag)[0];
    return el?.textContent?.trim() || undefined;
  };
  const meta: Record<string, string> = {};
  const title = get("title");
  const creator = get("creator");
  const language = get("language");
  if (title) meta.title = title;
  if (creator) meta.author = creator;
  if (language) meta.language = language;
  return meta;
}

interface ManifestItem {
  id: string;
  href: string;
  /** Caminho dentro do ZIP (relativo à raiz do ZIP). */
  zipPath: string;
  mediaType: string;
}

function buildManifest(
  opfDoc: Document,
  opfDir: string,
): { manifest: Record<string, ManifestItem>; manifestByHref: Record<string, ManifestItem> } {
  const manifest: Record<string, ManifestItem> = {};
  const manifestByHref: Record<string, ManifestItem> = {};
  const items = Array.from(opfDoc.getElementsByTagNameNS("*", "item"));
  for (const item of items) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    const mediaType = item.getAttribute("media-type") ?? "";
    if (!id || !href) continue;
    const zipPath = decodeURIComponent(resolveRelative(opfDir, href));
    const entry: ManifestItem = { id, href, zipPath, mediaType };
    manifest[id] = entry;
    manifestByHref[href] = entry;
  }
  return { manifest, manifestByHref };
}

function resolveRelative(base: string, rel: string): string {
  if (!base) return rel;
  try {
    return new URL(rel, `http://x/${base}`).pathname.slice(1);
  } catch {
    return rel;
  }
}

/**
 * Percorre o body do (X)HTML e extrai blocos de conteúdo.
 * Heurística simples: cada <p>, <h1-6>, <blockquote>, <ul/ol>, <img>
 * vira um Block. Outras tags viram parágrafos com texto agregado.
 */
function extractBlocks(doc: Document, chapId: string): Block[] {
  const blocks: Block[] = [];
  const body = doc.getElementsByTagName("body")[0] ?? doc.documentElement;
  let counter = 0;

  for (const node of Array.from(body.childNodes)) {
    walk(node, blocks, chapId, () => counter++);
  }
  return blocks;
}

function walk(
  node: ChildNode,
  blocks: Block[],
  chapId: string,
  nextId: () => number,
): void {
  if (node.nodeType !== 1) return; // só elementos
  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  const id = `${chapId}-b${nextId()}`;

  if (/^h[1-6]$/.test(tag)) {
    const text = el.textContent?.trim();
    if (text) blocks.push({ id, type: "heading", level: Number(tag[1]), text });
    return;
  }
  if (tag === "p") {
    const text = el.textContent?.trim();
    if (text) blocks.push({ id, type: "paragraph", text });
    return;
  }
  if (tag === "blockquote") {
    const text = el.textContent?.trim();
    if (text) blocks.push({ id, type: "quote", text });
    return;
  }
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(el.getElementsByTagName("li"))
      .map((li) => li.textContent?.trim() ?? "")
      .filter(Boolean);
    if (items.length) blocks.push({ id, type: "list", items });
    return;
  }
  if (tag === "img") {
    const src = el.getAttribute("src") ?? undefined;
    const alt = el.getAttribute("alt") ?? undefined;
    if (src) blocks.push({ id, type: "image", src, alt });
    return;
  }

  // Recursão: div, section, article, etc.
  for (const child of Array.from(el.childNodes)) {
    walk(child, blocks, chapId, nextId);
  }
}

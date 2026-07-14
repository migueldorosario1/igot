"use client";

/**
 * Hook useSession — orquestra a persistência da sessão de leitura.
 *
 * Responsabilidades:
 *   - Hidratar do IndexedDB no boot (async) → devolve `booting` enquanto carrega.
 *   - Manter o estado de leitura: book, pdfSource, chapterIdx, zoom.
 *   - Gravar no IndexedDB com DEBOUNCE (500ms) a cada mudança.
 *   - `openBook(file)`: parsea + grava nova sessão.
 *   - `closeBook()`: limpa a sessão.
 *
 * O debounce evita gravar a cada clique de "próxima página" — só grava depois
 * que o usuário para de navegar por meio segundo.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ParsedBook } from "@igot/parser";
import { parseBook } from "@igot/parser";
import { saveSession, loadSession, clearSession, type Session } from "./db";

const DEBOUNCE_MS = 500;

export function useSession() {
  const [booting, setBooting] = useState(true);
  const [book, setBook] = useState<ParsedBook | null>(null);
  const [pdfSource, setPdfSource] = useState<ArrayBuffer | null>(null);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs pra construir a sessão no debounce sem re-rodar o effect.
  const bookRef = useRef(book);
  const pdfRef = useRef(pdfSource);
  const chapRef = useRef(chapterIdx);
  const zoomRef = useRef(zoom);
  const metaRef = useRef<{ fileName: string; fileSize: number } | null>(null);
  bookRef.current = book;
  pdfRef.current = pdfSource;
  chapRef.current = chapterIdx;
  zoomRef.current = zoom;

  // --- Hidratação no boot ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await loadSession();
        if (cancelled || !saved) return;
        setBook(saved.book);
        // Reconstrói o ArrayBuffer a partir do Uint8Array guardado.
        // Cópia defensiva: o buffer do IndexedDB pode ser destacado depois.
        if (saved.pdfSource) {
          const copy = new ArrayBuffer(saved.pdfSource.byteLength);
          new Uint8Array(copy).set(saved.pdfSource);
          setPdfSource(copy);
        } else {
          setPdfSource(null);
        }
        setChapterIdx(saved.chapterIdx ?? 0);
        setZoom(saved.zoom ?? 1);
        metaRef.current = { fileName: saved.fileName, fileSize: saved.fileSize };
      } catch (err) {
        console.warn("Falha ao hidratar sessão:", err);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Debounce: grava a sessão 500ms após a última mudança ---
  useEffect(() => {
    if (booting || !book) return; // não grava antes de hidratar / sem livro
    const t = setTimeout(() => {
      const session: Session = {
        id: "current",
        fileName: metaRef.current?.fileName ?? book.title,
        fileSize: metaRef.current?.fileSize ?? 0,
        book,
        pdfSource: pdfRef.current ? new Uint8Array(pdfRef.current) : null,
        chapterIdx: chapRef.current,
        zoom: zoomRef.current,
        savedAt: Date.now(),
      };
      saveSession(session).catch((err) =>
        console.warn("Falha ao gravar sessão:", err),
      );
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [book, chapterIdx, zoom, booting]);

  // --- Abrir livro (upload) ---
  const openBook = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await file.arrayBuffer();
      const result = await parseBook({ data: data.slice(0), fileName: file.name });
      if (result.ok) {
        setBook(result.book);
        setPdfSource(result.book.sourceFormat === "pdf" ? data : null);
        setChapterIdx(0);
        setZoom(1);
        metaRef.current = { fileName: file.name, fileSize: file.size };
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Fechar livro ---
  const closeBook = useCallback(async () => {
    setBook(null);
    setPdfSource(null);
    setChapterIdx(0);
    setZoom(1);
    metaRef.current = null;
    await clearSession().catch((err) =>
      console.warn("Falha ao limpar sessão:", err),
    );
  }, []);

  return {
    booting,
    book,
    pdfSource,
    chapterIdx,
    setChapterIdx,
    zoom,
    setZoom,
    loading,
    error,
    openBook,
    closeBook,
  };
}

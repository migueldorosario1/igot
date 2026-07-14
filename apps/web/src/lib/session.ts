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
import {
  type Session,
  type SavedNote,
} from "./db";
import { saveBook, loadBook, deleteBook } from "./repository";

const DEBOUNCE_MS = 500;

export function useSession(userId: string | null = null) {
  const [booting, setBooting] = useState(true);
  const [book, setBook] = useState<ParsedBook | null>(null);
  const [pdfSource, setPdfSource] = useState<ArrayBuffer | null>(null);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Traduções por página + notas salvas (persistidas no IndexedDB).
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<SavedNote[]>([]);

  // Refs pra construir a sessão no debounce sem re-rodar o effect.
  const bookRef = useRef(book);
  const pdfRef = useRef(pdfSource);
  const chapRef = useRef(chapterIdx);
  const zoomRef = useRef(zoom);
  const translationsRef = useRef(translations);
  const notesRef = useRef(notes);
  const metaRef = useRef<{ fileName: string; fileSize: number } | null>(null);
  const cloudIdRef = useRef<string | undefined>(undefined); // id na nuvem (se logado)
  const userIdRef = useRef(userId);
  bookRef.current = book;
  pdfRef.current = pdfSource;
  chapRef.current = chapterIdx;
  zoomRef.current = zoom;
  translationsRef.current = translations;
  notesRef.current = notes;
  userIdRef.current = userId;

  // --- Hidratação no boot ---
  // Importante: o IndexedDB pode demorar, falhar silenciosamente (modo
  // privado do Safari/iOS) ou nunca disparar os callbacks. Pra nunca
  // travar o app em "Carregando…", usamos um TIMEOUT de segurança: se a
  // hidratação não resolver em 3s, desistimos e seguimos (app funciona sem
  // persistência — o usuário pode abrir um livro normalmente).
  useEffect(() => {
    let cancelled = false;
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      if (!cancelled) {
        console.warn("Timeout na hidratação da sessão — seguindo sem persistência.");
        setBooting(false);
      }
    }, 3000);

    (async () => {
      try {
        const result = await loadBook(userId);
        if (cancelled || timedOut || !result) return;
        const { session: saved, cloudId } = result;
        setBook(saved.book);
        if (saved.pdfSource) {
          const copy = new ArrayBuffer(saved.pdfSource.byteLength);
          new Uint8Array(copy).set(saved.pdfSource);
          setPdfSource(copy);
        } else {
          setPdfSource(null);
        }
        setChapterIdx(saved.chapterIdx ?? 0);
        setZoom(saved.zoom ?? 1);
        setTranslations(saved.translations ?? {});
        setNotes(saved.notes ?? []);
        metaRef.current = { fileName: saved.fileName, fileSize: saved.fileSize };
        cloudIdRef.current = cloudId;
      } catch (err) {
        console.warn("Falha ao hidratar sessão:", err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled && !timedOut) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  // --- Debounce: grava a sessão 500ms após a última mudança ---
  // Usa o repository adapter: logado → Supabase (nuvem); deslogado → IndexedDB.
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
        translations: translationsRef.current,
        notes: notesRef.current,
      };
      saveBook(session, userIdRef.current, cloudIdRef.current)
        .then((newCloudId) => {
          if (newCloudId) cloudIdRef.current = newCloudId;
        })
        .catch((err) => console.warn("Falha ao gravar:", err));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [book, chapterIdx, zoom, translations, notes, booting]);

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
        setTranslations({}); // novo livro = sem traduções ainda
        setNotes([]);
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

  // --- Fechar livro (local + nuvem se logado) ---
  const closeBook = useCallback(async () => {
    setBook(null);
    setPdfSource(null);
    setChapterIdx(0);
    setZoom(1);
    setTranslations({});
    setNotes([]);
    metaRef.current = null;
    await deleteBook(userIdRef.current, cloudIdRef.current).catch((err) =>
      console.warn("Falha ao limpar livro:", err),
    );
    cloudIdRef.current = undefined;
  }, []);

  // --- Re-hidrata quando muda o userId (login/logout no meio da sessão) ---
  useEffect(() => {
    if (booting) return;
    let cancelled = false;
    (async () => {
      const result = await loadBook(userId);
      if (cancelled) return;
      if (result) {
        const { session: saved, cloudId } = result;
        setBook(saved.book);
        setPdfSource(null);
        setChapterIdx(saved.chapterIdx ?? 0);
        setZoom(saved.zoom ?? 1);
        setTranslations(saved.translations ?? {});
        setNotes(saved.notes ?? []);
        metaRef.current = { fileName: saved.fileName, fileSize: saved.fileSize };
        cloudIdRef.current = cloudId;
      } else {
        cloudIdRef.current = undefined;
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // --- Persistir tradução de uma página ---
  // Recebe chapterIdx (number, 0-based) e converte pra String(chapterIdx+1)
  // pra alinhar com pageNum do PdfPageCanvas.
  const setPageTranslation = useCallback((chapterIdx: number, text: string) => {
    const key = String(chapterIdx + 1);
    setTranslations((prev) => ({ ...prev, [key]: text }));
  }, []);

  // --- Salvar uma anotação (tradução/explicação/pergunta) ---
  const addNote = useCallback(
    (entry: Omit<SavedNote, "id" | "savedAt">) => {
      const note: SavedNote = {
        ...entry,
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        savedAt: Date.now(),
      };
      setNotes((prev) => [note, ...prev]);
    },
    [],
  );

  // --- Remover uma anotação ---
  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
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
    translations,
    notes,
    setPageTranslation,
    addNote,
    removeNote,
    openBook,
    closeBook,
  };
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ParsedBook } from "@igot/parser";
import type { SelectionAction } from "@/lib/types";
import { PdfPageCanvas } from "./PdfPageCanvas";
import { translatePageStream, explainPageStream } from "@/lib/ai-client";

interface ReaderProps {
  book: ParsedBook;
  /** Buffer PDF original (só pra sourceFormat === "pdf"). */
  pdfSource?: ArrayBuffer | null;
  onSelection: (action: SelectionAction) => void;
  /** Capítulo/página inicial (hidratado do IndexedDB). */
  initialChapterIdx?: number;
  /** Zoom inicial (hidratado do IndexedDB). */
  initialZoom?: number;
  /** Avisa o pai quando muda de capítulo/página (pra persistir). */
  onChapterChange?: (n: number) => void;
  /** Avisa o pai quando muda o zoom (pra persistir). */
  onZoomChange?: (z: number) => void;
  /** Fecha o livro atual (volta pro uploader). */
  onCloseBook?: () => void;
  /** Traduções já prontas (chave = String(chapterIdx+1)). */
  translations?: Record<string, string>;
  /** Persiste a tradução de uma página. */
  onPageTranslation?: (chapterIdx: number, text: string) => void;
  /** Anotações salvas (pra abrir o modal de Notas). */
  notes?: Array<{ id: string; kind: string; source: string; result: string; savedAt: number }>;
  /** Remove uma anotação. */
  onRemoveNote?: (id: string) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.2;

/**
 * Painel de leitura.
 *
 * Renderiza os capítulos do livro. Quando o leitor seleciona um trecho,
 * mostra um menu flutuante (Traduzir / Explicar) que dispara `onSelection`.
 * Pra PDF: zoom + botão "Traduzir página" (overlay traduzido).
 *
 * `chapterIdx` e `zoom` são inicializados dos props `initial*` (hidratados
 * do IndexedDB no boot) e notificam o pai via `onChapterChange/onZoomChange`
 * pra persistência. Internamente continuam useState.
 */
export function Reader({
  book,
  pdfSource,
  onSelection,
  initialChapterIdx = 0,
  initialZoom = 1,
  onChapterChange,
  onZoomChange,
  onCloseBook,
  translations = {},
  onPageTranslation,
  notes = [],
  onRemoveNote,
}: ReaderProps) {
  const [chapterIdx, setChapterIdxState] = useState(initialChapterIdx);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /** Entra/sai do modo tela cheia (só a página do livro visível). */
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Atualiza estado se sair do fullscreen via ESC.
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);
  const [notesOpen, setNotesOpen] = useState(false);

  // Zoom e tradução de página (só fazem sentido pra PDF).
  const [zoom, setZoomState] = useState(initialZoom);
  const [pageTranslation, setPageTranslation] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatingPage, setTranslatingPage] = useState(false);
  const [currentPageText, setCurrentPageText] = useState("");

  const chapter = book.chapters[chapterIdx];
  const totalChapters = book.chapters.length;

  // Wrappers que atualizam o estado E avisam o pai (pra persistir).
  const setChapterIdx = (n: number | ((prev: number) => number)) => {
    setChapterIdxState((prev) => {
      const next = typeof n === "function" ? n(prev) : n;
      onChapterChange?.(next);
      return next;
    });
  };
  const setZoom = (n: number | ((prev: number) => number)) => {
    setZoomState((prev) => {
      const next = typeof n === "function" ? n(prev) : n;
      onZoomChange?.(next);
      return next;
    });
  };

  const goPrev = () => setChapterIdx((i) => Math.max(0, i - 1));
  const goNext = () =>
    setChapterIdx((i) => Math.min(totalChapters - 1, i + 1));

  // Ao trocar de página: RESTAURA do mapa de traduções se houver tradução
  // salva pra essa página (não re-traduz). Limpa o texto extraído antigo.
  useEffect(() => {
    const key = String(chapterIdx + 1);
    const saved = translations[key];
    if (saved) {
      setPageTranslation(saved);
      setShowTranslation(false); // volta pro original por padrão
    } else {
      setPageTranslation(null);
      setShowTranslation(false);
    }
    setCurrentPageText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdx]);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const zoomReset = () => setZoom(1);

  // Traduz OU explica a página inteira com STREAMING.
  // Persiste a tradução (não a explicação — explicação é efêmera).
  const handlePageAction = async (action: "translate" | "explain") => {
    // Se já temos conteúdo e é tradução, toggle.
    if (action === "translate" && pageTranslation) {
      setShowTranslation((s) => !s);
      return;
    }
    if (!currentPageText || translatingPage) return;
    setTranslatingPage(true);
    setPageTranslation("");
    setShowTranslation(true);

    const ctx = {
      bookTitle: book.title,
      bookAuthor: book.author,
      bookLanguage: book.language,
    };
    const onChunk = (full: string) => setPageTranslation(full);

    const result =
      action === "translate"
        ? await translatePageStream(currentPageText, ctx, onChunk)
        : await explainPageStream(currentPageText, ctx, onChunk);

    setTranslatingPage(false);
    if (result.ok && result.text) {
      setPageTranslation(result.text);
      // Só persiste tradução (não explicação).
      if (action === "translate") {
        onPageTranslation?.(chapterIdx, result.text);
      }
    } else {
      setPageTranslation(`⚠️ ${result.error ?? "Erro."}`);
    }
  };

  /** Atalho pra traduzir (compatibilidade). */
  const handleTranslatePage = () => handlePageAction("translate");

  /** Rótulo dinâmico do botão conforme o estado. */
  const translateBtnLabel = translatingPage
    ? "⏳ Traduzindo…"
    : pageTranslation
      ? showTranslation
        ? "📖 Ver original"
        : "🌐 Ver tradução"
      : "🌐 Traduzir página";

  // Detecta seleção dentro do conteúdo e, se houver texto, mostra o menu.
  const handleSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setMenu(null);
      return;
    }
    const text = sel.toString().trim();
    if (!text || text.length < 2) {
      setMenu(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    setMenu({
      x: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
      y: rect.top - (containerRect?.top ?? 0) - 12,
      text,
    });
  };

  /**
   * Escuta mudanças de seleção no documento (funciona em mouse E touch).
   * No iPad/touch puro, o onMouseUp às vezes não dispara depois de arrastar
   * pra selecionar — o selectionchange é o evento confiável. Mostra o menu
   * quando a seleção estabiliza (debounce de 250ms).
   */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const check = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setMenu(null);
          return;
        }
        const text = sel.toString().trim();
        if (!text || text.length < 2) {
          setMenu(null);
          return;
        }
        // Só mostra o menu se a seleção está DENTRO do reader.
        const range = sel.getRangeAt(0);
        if (!containerRef.current?.contains(range.commonAncestorContainer)) {
          return;
        }
        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        setMenu({
          x: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
          y: rect.top - (containerRect?.top ?? 0) - 12,
          text,
        });
      }, 250);
    };
    document.addEventListener("selectionchange", check);
    return () => {
      document.removeEventListener("selectionchange", check);
      if (timer) clearTimeout(timer);
    };
  }, []);

  /**
   * Toque duplo (double-click/double-tap): seleciona o parágrafo inteiro
   * sob o cursor. Muito útil em touch, onde arrastar pra selecionar é
   * impreciso. Encontra o ancestral <p> (ou block mais próximo) e seleciona
   * todo o seu conteúdo, depois dispara o menu Traduzir/Explicar.
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Sobe até achar um parágrafo, heading, quote ou listItem.
    const block = target.closest("p, h1, h2, h3, h4, h5, h6, blockquote, li, span");
    if (!block) return;

    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(block);
    sel.removeAllRanges();
    sel.addRange(range);

    // Dispara o menu na posição do parágrafo.
    const rect = block.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const text = sel.toString().trim();
    if (text.length >= 2) {
      setMenu({
        x: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
        y: rect.top - (containerRect?.top ?? 0) - 12,
        text,
      });
    }
  };

  const fire = (type: SelectionAction["type"]) => {
    if (!menu) return;
    // targetLang é resolvido pelo ai-client a partir da config do usuário.
    onSelection({
      type,
      text: menu.text,
      chapterId: chapter?.id,
    });
    setMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const renderedBlocks = useMemo(
    () => chapter?.blocks.map((b) => <BlockView key={b.id} block={b} />),
    [chapter],
  );

  return (
    <section className="reader" ref={containerRef}>
      <header className="reader-header">
        <div className="reader-title">
          <h1>{book.title}</h1>
          {book.sourceFormat === "pdf" ? (
            book.author && <span className="reader-author">{book.author}</span>
          ) : (
            <span className="reader-author">
              {chapter?.title || `Capítulo ${chapterIdx + 1}`}
              {book.author && ` · ${book.author}`}
            </span>
          )}
        </div>
        <div className="reader-actions">
          <button
            onClick={toggleFullscreen}
            className="fullscreen-btn"
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            aria-label="Tela cheia"
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>
          <button
            onClick={() => setNotesOpen(true)}
            className="notes-btn"
            title="Minhas anotações"
          >
            📓 <span className="btn-label">{notes.length > 0 ? notes.length : ""}</span>
          </button>
          <button
            onClick={onCloseBook}
            className="open-other-btn"
            title="Fechar e abrir outro livro"
          >
            📂 Abrir outro
          </button>
          {book.sourceFormat === "pdf" && pdfSource && (
            <>
              <div className="reader-zoom" title="Zoom">
                <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Diminuir zoom">
                  −
                </button>
                <button onClick={zoomReset} className="zoom-value" aria-label="Restaurar zoom">
                  {Math.round(zoom * 100)}%
                </button>
                <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Aumentar zoom">
                  +
                </button>
              </div>
              <button
                onClick={handleTranslatePage}
                disabled={translatingPage || !currentPageText}
                className="translate-page-btn"
                title={pageTranslation ? "Alternar entre original e tradução" : "Traduzir a página inteira"}
              >
                {translateBtnLabel}
              </button>
              <button
                onClick={() => handlePageAction("explain")}
                disabled={translatingPage || !currentPageText}
                className="translate-page-btn"
                title="Explicar a página inteira"
              >
                {translatingPage ? "⏳…" : "🧠 Explicar página"}
              </button>
            </>
          )}
          <div className="reader-nav">
            <button onClick={goPrev} disabled={chapterIdx === 0} aria-label={book.sourceFormat === "pdf" ? "Página anterior" : "Capítulo anterior"}>
              ‹
            </button>
            <span className="reader-counter">
              {chapterIdx + 1} / {totalChapters}
            </span>
            <button
              onClick={goNext}
              disabled={chapterIdx >= totalChapters - 1}
              aria-label={book.sourceFormat === "pdf" ? "Próxima página" : "Próximo capítulo"}
            >
              ›
            </button>
          </div>
        </div>
        {/* Barra de progresso de leitura (estilo Kindle) */}
        <div className="reader-progress" aria-hidden>
          <div
            className="reader-progress-bar"
            style={{ width: `${totalChapters > 0 ? ((chapterIdx + 1) / totalChapters) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div
        className={`reader-scroll ${book.sourceFormat === "pdf" ? "pdf-mode" : ""}`}
        onPointerUp={handleSelection}
        onDoubleClick={handleDoubleClick}
      >
        {book.sourceFormat === "pdf" && pdfSource ? (
          <PdfPageCanvas
            data={pdfSource}
            pageNum={chapterIdx + 1}
            zoom={zoom}
            translationOverlay={pageTranslation}
            showTranslation={showTranslation}
            onPageText={setCurrentPageText}
          />
        ) : (
          <article className="reader-text">
            {renderedBlocks}
          </article>
        )}
      </div>

      {/* Barra de navegação rápida — slider horizontal pra pular páginas */}
      {totalChapters > 1 && (
        <div className="reader-nav-bar">
          <button onClick={goPrev} disabled={chapterIdx === 0} aria-label="Anterior">
            ‹
          </button>
          <input
            type="range"
            min={0}
            max={totalChapters - 1}
            value={chapterIdx}
            onChange={(e) => setChapterIdx(Number(e.target.value))}
            className="nav-slider"
            aria-label="Navegar páginas"
          />
          <button
            onClick={goNext}
            disabled={chapterIdx >= totalChapters - 1}
            aria-label="Próxima"
          >
            ›
          </button>
          <span className="nav-counter-bottom">
            {chapterIdx + 1}/{totalChapters}
          </span>
        </div>
      )}

      {menu && (
        <div
          className="selection-menu"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
        >
          <button onClick={() => fire("translate")} role="menuitem">
            🌐 Traduzir
          </button>
          <button onClick={() => fire("explain")} role="menuitem">
            🧠 Explicar
          </button>
        </div>
      )}

      {notesOpen && (
        <div className="notes-overlay" onClick={() => setNotesOpen(false)}>
          <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
            <header className="notes-header">
              <h2>📓 Minhas anotações</h2>
              <button onClick={() => setNotesOpen(false)} aria-label="Fechar">✕</button>
            </header>
            <div className="notes-body">
              {notes.length === 0 ? (
                <p className="notes-empty">
                  Você ainda não salvou nenhuma anotação deste livro.
                  <br />
                  Selecione um trecho, peça <strong>Traduzir</strong> ou{" "}
                  <strong>Explicar</strong>, e clique em <strong>📌 Salvar</strong>.
                </p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="note-card">
                    <div className="note-meta">
                      <span className={`note-kind note-${n.kind}`}>
                        {n.kind === "translate" ? "🌐 Tradução" : n.kind === "explain" ? "🧠 Explicação" : "❓ Pergunta"}
                      </span>
                      <time>{new Date(n.savedAt).toLocaleString("pt-BR")}</time>
                      <button
                        className="note-delete"
                        onClick={() => onRemoveNote?.(n.id)}
                        aria-label="Excluir"
                      >
                        🗑
                      </button>
                    </div>
                    {n.source && (
                      <blockquote className="note-source">{n.source}</blockquote>
                    )}
                    <div className="note-result">{n.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reader {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg);
          border-right: 1px solid var(--border);
          position: relative;
        }
        /* Em tela cheia: ocupa toda a tela, mantém header + nav visíveis. */
        .reader:fullscreen {
          width: 100vw;
          height: 100vh;
          border-right: none;
        }
        .reader:fullscreen .reader-header {
          padding: 8px 16px;
        }
        .reader:fullscreen .reader-scroll {
          padding-top: 16px;
        }
        .reader-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 28px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .reader-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .reader-zoom {
          display: flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .reader-zoom button {
          border: none;
          background: transparent;
          color: var(--text);
          width: 30px;
          height: 30px;
          font-size: 16px;
          border-radius: 0;
        }
        .reader-zoom button:hover:not(:disabled) {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .reader-zoom .zoom-value {
          width: auto;
          min-width: 48px;
          font-size: 12px;
          border-left: 1px solid var(--border);
          border-right: 1px solid var(--border);
        }
        .translate-page-btn {
          padding: 6px 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 8px;
          font-size: 13px;
          white-space: nowrap;
        }
        .translate-page-btn:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
        }
        .translate-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .open-other-btn,
        .notes-btn {
          padding: 6px 12px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 8px;
          font-size: 13px;
          white-space: nowrap;
        }
        .open-other-btn:hover,
        .notes-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .notes-btn .btn-label {
          font-size: 11px;
          opacity: 0.7;
        }

        /* Modal de Notas */
        .notes-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .notes-modal {
          background: var(--bg);
          border-radius: 14px;
          width: 100%;
          max-width: 620px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .notes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
        }
        .notes-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }
        .notes-header button {
          border: none;
          background: var(--surface-alt);
          color: var(--text-muted);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
        }
        .notes-body {
          padding: 20px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .notes-empty {
          text-align: center;
          color: var(--text-muted);
          line-height: 1.7;
          margin: 40px 0;
        }
        .note-card {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px;
          background: var(--surface);
        }
        .note-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 12px;
          color: var(--text-muted);
        }
        .note-kind {
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 6px;
          background: var(--surface-alt);
        }
        .note-meta time {
          font-size: 11px;
        }
        .note-delete {
          margin-left: auto;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.5;
        }
        .note-delete:hover {
          opacity: 1;
        }
        .note-source {
          margin: 0 0 8px;
          padding: 8px 10px;
          background: var(--surface-alt);
          border-left: 3px solid var(--accent);
          border-radius: 4px;
          font-size: 13px;
          font-style: italic;
          white-space: pre-wrap;
        }
        .note-result {
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          color: var(--text);
        }
        .reader-title h1 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .reader-author {
          font-size: 13px;
          color: var(--text-muted);
        }
        .reader-nav {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .reader-nav button {
          width: 32px;
          height: 32px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 8px;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reader-nav button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .reader-counter {
          font-size: 13px;
          color: var(--text-muted);
          min-width: 56px;
          text-align: center;
        }
        .reader-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 40px 0 80px;
        }
        .reader-text {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 32px;
          font-family: var(--font-serif);
          font-size: var(--text-lg);
          line-height: 1.8;
          color: var(--text);
        }
        /* Barra de progresso de leitura */
        .reader-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--surface-alt);
          overflow: hidden;
        }
        .reader-progress-bar {
          height: 100%;
          background: var(--accent);
          transition: width 200ms ease;
          border-radius: 0 2px 2px 0;
        }
        .reader-text h2 {
          font-size: 22px;
          margin-top: 0;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Barra de navegação rápida (slider horizontal no rodapé) */
        .reader-nav-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .reader-nav-bar button {
          width: 36px;
          height: 36px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          border-radius: 8px;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .reader-nav-bar button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .reader-nav-bar button:not(:disabled):hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .nav-slider {
          flex: 1;
          height: 36px;
          cursor: pointer;
          accent-color: var(--accent);
        }
        .nav-counter-bottom {
          font-size: var(--text-sm);
          color: var(--text-muted);
          min-width: 60px;
          text-align: center;
          flex-shrink: 0;
        }
        .selection-menu {
          position: absolute;
          transform: translate(-50%, -100%);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          box-shadow: var(--shadow);
          display: flex;
          gap: 2px;
          padding: 4px;
          z-index: 10;
        }
        .selection-menu button {
          border: none;
          background: transparent;
          color: var(--text);
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 14px;
          white-space: nowrap;
        }
        .selection-menu button:hover {
          background: var(--accent-soft);
          color: var(--accent);
        }
      `}</style>
    </section>
  );
}

/** Renderiza um bloco conforme seu tipo. */
function BlockView({ block }: { block: import("@igot/parser").Block }) {
  switch (block.type) {
    case "heading":
      switch (block.level) {
        case 1:
          return <h1>{block.text}</h1>;
        case 2:
          return <h2>{block.text}</h2>;
        case 3:
          return <h3>{block.text}</h3>;
        default:
          return <h4>{block.text}</h4>;
      }
    case "quote":
      return <blockquote>{block.text}</blockquote>;
    case "list":
      return (
        <ul>
          {block.items?.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case "image":
      return block.src ? <img src={block.src} alt={block.alt ?? ""} /> : null;
    case "page-break":
      return <hr />;
    default:
      return <p>{block.text}</p>;
  }
}

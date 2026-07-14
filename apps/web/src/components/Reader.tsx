"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ParsedBook } from "@igot/parser";
import type { SelectionAction } from "@/lib/types";
import { PdfPageCanvas } from "./PdfPageCanvas";
import { translatePage } from "@/lib/ai-client";

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
}: ReaderProps) {
  const [chapterIdx, setChapterIdxState] = useState(initialChapterIdx);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Ao trocar de página, descarta a tradução e o texto antigo.
  useEffect(() => {
    setPageTranslation(null);
    setShowTranslation(false);
    setCurrentPageText("");
  }, [chapterIdx]);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const zoomReset = () => setZoom(1);

  // Traduz a página inteira. Mantém a tradução guardada (não re-traduz ao
  // alternar Original ⇄ Tradução).
  const handleTranslatePage = async () => {
    // Se já temos a tradução, só alterna a visibilidade (toggle).
    if (pageTranslation) {
      setShowTranslation((s) => !s);
      return;
    }
    if (!currentPageText || translatingPage) return;
    setTranslatingPage(true);
    const result = await translatePage(currentPageText, {
      bookTitle: book.title,
      bookAuthor: book.author,
      bookLanguage: book.language,
    });
    setTranslatingPage(false);
    if (result.ok && result.text) {
      setPageTranslation(result.text);
      setShowTranslation(true); // mostra a tradução assim que fica pronta
    } else {
      setPageTranslation(`⚠️ ${result.error ?? "Erro ao traduzir."}`);
      setShowTranslation(true);
    }
  };

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
      </header>

      <div className="reader-scroll" onMouseUp={handleSelection}>
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
            {chapter?.title && <h2>{chapter.title}</h2>}
            {renderedBlocks}
          </article>
        )}
      </div>

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

      <style jsx>{`
        .reader {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg);
          border-right: 1px solid var(--border);
          position: relative;
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
          font-size: 18px;
          line-height: 1.7;
          color: var(--text);
        }
        .reader-text h2 {
          font-size: 22px;
          margin-top: 0;
          color: var(--text-muted);
          font-weight: 500;
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

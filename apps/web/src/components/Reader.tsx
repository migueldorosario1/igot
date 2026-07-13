"use client";

import { useMemo, useRef, useState } from "react";
import type { ParsedBook } from "@igot/parser";
import type { SelectionAction } from "@/lib/types";

interface ReaderProps {
  book: ParsedBook;
  onSelection: (action: SelectionAction) => void;
}

/**
 * Painel de leitura.
 *
 * Renderiza os capítulos do livro. Quando o leitor seleciona um trecho,
 * mostra um menu flutuante (Traduzir / Explicar) que dispara `onSelection`.
 */
export function Reader({ book, onSelection }: ReaderProps) {
  const [chapterIdx, setChapterIdx] = useState(0);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const chapter = book.chapters[chapterIdx];
  const totalChapters = book.chapters.length;

  const goPrev = () => setChapterIdx((i) => Math.max(0, i - 1));
  const goNext = () =>
    setChapterIdx((i) => Math.min(totalChapters - 1, i + 1));

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
          {book.author && <span className="reader-author">{book.author}</span>}
        </div>
        <div className="reader-nav">
          <button onClick={goPrev} disabled={chapterIdx === 0} aria-label="Capítulo anterior">
            ‹
          </button>
          <span className="reader-counter">
            {chapterIdx + 1} / {totalChapters}
          </span>
          <button
            onClick={goNext}
            disabled={chapterIdx >= totalChapters - 1}
            aria-label="Próximo capítulo"
          >
            ›
          </button>
        </div>
      </header>

      <div className="reader-scroll" onMouseUp={handleSelection}>
        <article className="reader-text">
          {chapter?.title && <h2>{chapter.title}</h2>}
          {renderedBlocks}
        </article>
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
        }
        .reader-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 28px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
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

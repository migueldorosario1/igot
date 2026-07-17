"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ParsedBook } from "@igot/parser";
import type { SelectionAction } from "@/lib/types";
import { PdfPageCanvas } from "./PdfPageCanvas";
import { CafezinhoLogo } from "./CafezinhoLogo";
import { translatePageStream, explainPageStream, translateStream, explainStream } from "@/lib/ai-client";

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
  /** Abre as configurações de IA (pra acessar em fullscreen). */
  onOpenSettings?: () => void;
  /** Traduções já prontas (chave = String(chapterIdx+1)). */
  translations?: Record<string, string>;
  /** Persiste a tradução de uma página. */
  onPageTranslation?: (chapterIdx: number, text: string) => void;
  /** Anotações salvas (pra abrir o modal de Notas). */
  notes?: Array<{ id: string; kind: string; source: string; result: string; savedAt: number }>;
  /** Remove uma anotação. */
  onRemoveNote?: (id: string) => void;
  /** Salva uma nota (auto-save de tradução/explicação em fullscreen). */
  onSaveNote?: (entry: { kind: "translate" | "explain" | "ask"; source: string; result: string; chapterId?: string }) => void;
  /** Marcadores salvos (chapterIdx + timestamp). */
  bookmarks?: Array<{ chapterIdx: number; savedAt: number }>;
  /** Adiciona/remove um marcador da página atual. */
  onToggleBookmark?: (chapterIdx: number) => void;
  /** Volta pra estante (home). */
  onGoToShelf?: () => void;
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
  onOpenSettings,
  translations = {},
  onPageTranslation,
  notes = [],
  onRemoveNote,
  onSaveNote,
  bookmarks = [],
  onToggleBookmark,
  onGoToShelf,
}: ReaderProps) {
  const [chapterIdx, setChapterIdxState] = useState(initialChapterIdx);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(true);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);

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

  /** Esta página já está marcada? (lookup rápido no array de bookmarks). */
  const isBookmarked = bookmarks.some((b) => b.chapterIdx === chapterIdx);

  /** Marca/desmarca a página atual. */
  const toggleBookmark = () => onToggleBookmark?.(chapterIdx);

  /**
   * Marcador invisível: clica no canto superior direito da página do livro
   * pra marcar/desmarcar. Zona de 60×60px discreta. Não interfere no texto.
   */
  const handleInvisibleMark = (e: React.MouseEvent) => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const rect = scrollEl.getBoundingClientRect();
    // Canto superior direito (60×60px).
    const inCorner =
      e.clientX > rect.right - 60 && e.clientY < rect.top + 60;
    if (inCorner) {
      e.preventDefault();
      toggleBookmark();
    }
  };

  /**
   * Print da página atual: abre um iframe escondido com o texto do capítulo
   * e dispara o diálogo de impressão do navegador. Funciona em PDF (texto
   * extraído) e EPUB (conteúdo renderizado).
   */
  const printPage = () => {
    const titleText = `${book.title} — ${
      book.sourceFormat === "pdf"
        ? `Página ${chapterIdx + 1}`
        : chapter?.title || `Capítulo ${chapterIdx + 1}`
    }`;
    // Coleta o texto: do currentPageText (PDF extraído) ou dos blocos (EPUB).
    const textContent =
      book.sourceFormat === "pdf"
        ? currentPageText ||
          chapter?.blocks.map((b) => b.text ?? b.items?.join(" ") ?? "").join("\n\n") ||
          ""
        : chapter?.blocks
            .map((b) => {
              if (b.type === "heading") return `${"#".repeat(b.level || 1)} ${b.text}`;
              if (b.type === "list") return (b.items ?? []).map((i) => `• ${i}`).join("\n");
              if (b.type === "quote") return `> ${b.text}`;
              if (b.type === "page-break") return "---";
              return b.text ?? "";
            })
            .join("\n\n") ?? "";

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titleText}</title>
      <style>
        body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:0 24px;line-height:1.7;color:#222}
        h1{font-size:18px;margin:0 0 4px}h2,h3,h4{margin:18px 0 6px}
        blockquote{border-left:3px solid #ccc;padding-left:12px;color:#555;font-style:italic}
        @media print{body{margin:0}}
      </style></head><body><h1>${titleText}</h1>${
        book.author ? `<p style="color:#888;font-size:13px">${book.author}</p>` : ""
      }<hr><div style="white-space:pre-wrap">${escapeHtml(textContent)}</div></body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 300);
    }
  };
  const [notesOpen, setNotesOpen] = useState(false);

  // --- Resultado de trecho em fullscreen (painel flutuante) ---
  const [fsResult, setFsResult] = useState<string | null>(null);
  const [fsLoading, setFsLoading] = useState(false);
  const [fsAction, setFsAction] = useState<"translate" | "explain" | null>(null);

  /** Em fullscreen, processa seleção de trecho internamente (sem ir pro AIPanel externo). */
  const handleFsSelectionAction = async (
    action: "translate" | "explain",
    text: string,
  ) => {
    setFsAction(action);
    setFsLoading(true);
    setFsResult("");
    const ctx = { bookTitle: book.title, bookAuthor: book.author, bookLanguage: book.language };
    const onChunk = (full: string) => setFsResult(full);
    const res =
      action === "translate"
        ? await translateStream(text, ctx, onChunk)
        : await explainStream(text, ctx, onChunk);
    setFsLoading(false);
    if (res.ok && res.text) {
      setFsResult(res.text);
      // AUTO-SAVE: salva a tradução/explicação nas notas automaticamente.
      onSaveNote?.({
        kind: action,
        source: text,
        result: res.text,
        chapterId: chapter?.id,
      });
    } else {
      setFsResult(`⚠️ ${res.error ?? "Erro."}`);
    }
  };

  // --- Swipe horizontal: passar página passando o dedo ---
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    // Só conta como swipe horizontal se dx > 60px e mais horizontal que vertical.
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) goPrev(); // dedo da esquerda pra direita = anterior
    else goNext(); // dedo da direita pra esquerda = próxima
  };

  // Zoom e tradução de página (só fazem sentido pra PDF).
  const [zoom, setZoomState] = useState(initialZoom);
  const [pageTranslation, setPageTranslation] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [overlayMode, setOverlayMode] = useState<"translate" | "explain" | null>(null);
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
    setOverlayMode(null);
    setCurrentPageText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdx]);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const zoomReset = () => setZoom(1);

  // Traduz OU explica a página inteira. Estados SEPARADOS — um botão não
  // ativa o outro. overlayMode rastreia qual ação está sendo mostrada.
  const handlePageAction = async (action: "translate" | "explain") => {
    // Se já estamos mostrando ESTA ação, toggle (esconde).
    if (overlayMode === action && showTranslation) {
      setShowTranslation(false);
      return;
    }
    // Se tem tradução salva e é translate, mostra ela sem re-traduzir.
    if (action === "translate" && pageTranslation && overlayMode !== "explain") {
      setOverlayMode("translate");
      setShowTranslation(true);
      return;
    }
    if (!currentPageText || translatingPage) return;

    setTranslatingPage(true);
    setOverlayMode(action);
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
      if (action === "translate") {
        onPageTranslation?.(chapterIdx, result.text);
      }
    } else {
      setPageTranslation(`⚠️ ${result.error ?? "Erro."}`);
    }
  };

  /** Atalho pra traduzir. */
  const handleTranslatePage = () => handlePageAction("translate");

  /** Rótulo dinâmico do botão conforme o estado. */
  const translateBtnLabel = translatingPage && overlayMode === "translate"
    ? "⏳ Traduzindo…"
    : pageTranslation && overlayMode === "translate"
      ? showTranslation
        ? "📖 Ver original"
        : "🌐 Ver tradução"
      : "🌐 Traduzir página";

  const explainBtnLabel = translatingPage && overlayMode === "explain"
    ? "⏳ Explicando…"
    : overlayMode === "explain" && showTranslation
      ? "📖 Ver original"
      : "🧠 Explicar página";

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
        // Posiciona ACIMA da seleção com distância (não sobrepõe o texto).
        setMenu({
          x: rect.left + rect.width / 2 - (containerRect?.left ?? 0),
          y: Math.max(10, rect.top - (containerRect?.top ?? 0) - 50),
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
        y: Math.max(10, rect.top - (containerRect?.top ?? 0) - 50),
        text,
      });
    }
  };

  const fire = (type: SelectionAction["type"]) => {
    if (!menu) return;
    if (isFullscreen) {
      // Em fullscreen, processa internamente (painel flutuante).
      handleFsSelectionAction(type, menu.text);
    } else {
      // Normal: manda pro AIPanel externo.
      onSelection({
        type,
        text: menu.text,
        chapterId: chapter?.id,
      });
    }
    setMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const renderedBlocks = useMemo(
    () => chapter?.blocks.map((b) => <BlockView key={b.id} block={b} />),
    [chapter],
  );

  return (
    <section className="reader" ref={containerRef}>
      <header className="reader-header" data-hidden={!menuVisible}>
        {/* Logo Cafezinho — sempre presente, canto esquerdo, vazada */}
        <a
          href="/"
          onClick={(e) => { if (onGoToShelf) { e.preventDefault(); onGoToShelf(); } }}
          className="cafezinho-mark"
          title="Cafezinho Media Group — Voltar à estante"
          aria-label="Voltar à estante"
        >
          <CafezinhoLogo size={28} opacity={0.85} />
        </a>
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
            onClick={() => setNotesOpen(true)}
            className="notes-btn"
            title="Minhas anotações"
          >
            📓 <span className="btn-label">{notes.length > 0 ? notes.length : ""}</span>
          </button>
          {/* Lista de marcadores */}
          <button
            onClick={() => setBookmarksOpen(true)}
            className="notes-btn"
            title="Meus marcadores"
          >
            🔖 <span className="btn-label">{bookmarks.length > 0 ? bookmarks.length : ""}</span>
          </button>
          {/* Marcador de página (bookmark) */}
          <button
            onClick={toggleBookmark}
            className={`icon-btn bookmark-btn ${isBookmarked ? "active" : ""}`}
            title={isBookmarked ? "Remover marcador desta página" : "Marcar esta página"}
            aria-label="Marcador"
            aria-pressed={isBookmarked}
          >
            {isBookmarked ? "🔖" : "🏷"}
          </button>
          {/* Estante — volta pra home */}
          <button
            onClick={() => onGoToShelf?.()}
            className="icon-btn"
            title="Minha estante"
            aria-label="Estante"
          >
            📚
          </button>
          {/* Print da página */}
          <button
            onClick={printPage}
            className="icon-btn"
            title="Imprimir / salvar esta página em PDF"
            aria-label="Imprimir página"
          >
            🖨
          </button>
          {/* Abrir outro livro */}
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
                disabled={(translatingPage && overlayMode !== "explain") || !currentPageText}
                className="translate-page-btn"
                title="Explicar a página inteira"
              >
                {explainBtnLabel}
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
          {/* ⚙️ Configurações — no final, depois da numeração (como pedido) */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="icon-btn"
              title="Configurações de IA"
              aria-label="Configurações"
            >
              ⚙️
            </button>
          )}
          {/* Tela cheia */}
          <button
            onClick={toggleFullscreen}
            className="icon-btn"
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            aria-label="Tela cheia"
          >
            {isFullscreen ? "🗗" : "⛶"}
          </button>
          {/* Ocultar/mostrar menu (só visível em fullscreen, canto direito) */}
          {isFullscreen && (
            <button
              onClick={() => setMenuVisible((v) => !v)}
              className="icon-btn menu-toggle-btn"
              title={menuVisible ? "Ocultar menu" : "Mostrar menu"}
              aria-label="Alternar menu"
            >
              {menuVisible ? "👁" : "🙈"}
            </button>
          )}
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
        ref={scrollRef}
        className={`reader-scroll ${book.sourceFormat === "pdf" ? "pdf-mode" : ""}`}
        onPointerUp={handleSelection}
        onDoubleClick={handleDoubleClick}
        onClick={handleInvisibleMark}
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

      {/* Painel flutuante de resultado em FULLSCREEN (tradução/explicação de trecho) */}
      {isFullscreen && (fsResult !== null || fsLoading) && (
        <div className="fs-result-panel">
          <div className="fs-result-header">
            <span>{fsAction === "translate" ? "🌐 Tradução" : "🧠 Explicação"}</span>
            <button onClick={() => { setFsResult(null); setFsAction(null); }}>✕</button>
          </div>
          <div className="fs-result-body">
            {fsLoading && !fsResult && <p>Processando…</p>}
            {fsResult && <p>{fsResult}</p>}
          </div>
        </div>
      )}

      {/* Botão flutuante pra re-mostrar o menu quando oculto em fullscreen */}
      {isFullscreen && !menuVisible && (
        <button
          onClick={() => setMenuVisible(true)}
          className="fs-show-menu-btn"
          title="Mostrar menu"
          aria-label="Mostrar menu"
        >
          <CafezinhoLogo size={22} opacity={0.9} />
        </button>
      )}

      {/* Modal de marcadores (bookmarks) */}
      {bookmarksOpen && (
        <div className="notes-overlay" onClick={() => setBookmarksOpen(false)}>
          <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
            <header className="notes-header">
              <h2>🔖 Marcadores</h2>
              <button onClick={() => setBookmarksOpen(false)} aria-label="Fechar">✕</button>
            </header>
            <div className="notes-body">
              {bookmarks.length === 0 ? (
                <p className="notes-empty">
                  Você ainda não marcou nenhuma página.
                  <br />
                  Toque em <strong>🔖</strong> ou no canto superior direito da
                  página para marcar.
                </p>
              ) : (
                [...bookmarks]
                  .sort((a, b) => b.savedAt - a.savedAt)
                  .map((bm) => {
                    const ch = book.chapters[bm.chapterIdx];
                    const label =
                      book.sourceFormat === "pdf"
                        ? `Página ${bm.chapterIdx + 1}`
                        : ch?.title || `Capítulo ${bm.chapterIdx + 1}`;
                    return (
                      <button
                        key={`${bm.chapterIdx}-${bm.savedAt}`}
                        className="bookmark-item"
                        onClick={() => {
                          setChapterIdx(bm.chapterIdx);
                          setBookmarksOpen(false);
                        }}
                      >
                        <span className="bookmark-label">{label}</span>
                        <span className="bookmark-date">
                          {new Date(bm.savedAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
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

        /* Logo Cafezinho no header do reader (canto esquerdo, vazada) */
        .cafezinho-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          color: var(--text-muted);
          transition: var(--transition);
          flex-shrink: 0;
          text-decoration: none;
        }
        .cafezinho-mark:hover {
          background: var(--accent-soft);
          color: var(--accent);
        }

        /* Botões de ícone reutilizáveis (44px touch target) */
        .icon-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 10px;
          font-size: 18px;
          cursor: pointer;
          transition: var(--transition);
          flex-shrink: 0;
        }
        .icon-btn:hover {
          border-color: var(--accent);
          transform: scale(1.05);
        }
        /* Marcador ativo: destaque dourado */
        .bookmark-btn.active {
          background: var(--accent-soft);
          border-color: var(--accent);
        }

        /* Em fullscreen, esconde o header quando menu invisível */
        .reader:fullscreen .reader-header[data-hidden="true"] {
          transform: translateY(-100%);
          opacity: 0;
          pointer-events: none;
        }
        .reader:fullscreen .reader-header {
          transition: transform 200ms ease, opacity 200ms ease;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(var(--surface-rgb, 255, 255, 255), 0.96);
          backdrop-filter: blur(8px);
        }
        /* Nav-bar também some quando menu invisível em fullscreen */
        .reader:fullscreen .reader-nav-bar {
          transition: transform 200ms ease, opacity 200ms ease;
        }
        .reader:fullscreen[data-menu-hidden="true"] .reader-nav-bar,
        .reader:fullscreen .reader-nav-bar[data-hidden="true"] {
          transform: translateY(100%);
          opacity: 0;
          pointer-events: none;
        }

        /* Botão flutuante pra re-mostrar menu em fullscreen (logo Cafezinho) */
        .fs-show-menu-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 48px;
          height: 48px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          z-index: 60;
          transition: var(--transition);
        }
        .fs-show-menu-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Itens do modal de marcadores */
        .bookmark-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          width: 100%;
          text-align: left;
          padding: 12px 14px;
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 10px;
          cursor: pointer;
          transition: var(--transition);
          color: var(--text);
        }
        .bookmark-item:hover {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .bookmark-label {
          font-weight: 600;
          font-size: var(--text-sm);
        }
        .bookmark-date {
          font-size: 11px;
          color: var(--text-muted);
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

        /* Painel flutuante de resultado em fullscreen */
        .fs-result-panel {
          position: absolute;
          bottom: 80px;
          right: 20px;
          width: 380px;
          max-width: 90vw;
          max-height: 50vh;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          z-index: 100;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .fs-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          font-weight: 600;
          font-size: var(--text-sm);
        }
        .fs-result-header button {
          border: none;
          background: transparent;
          font-size: 18px;
          cursor: pointer;
          color: var(--text-muted);
        }
        .fs-result-body {
          padding: 14px;
          overflow-y: auto;
          font-size: var(--text-base);
          line-height: 1.7;
          white-space: pre-wrap;
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
          transform: translate(-50%, 0);
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

/** Escapa HTML pra injetar com segurança no iframe de print. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

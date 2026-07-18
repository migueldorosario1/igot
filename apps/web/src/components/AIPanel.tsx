"use client";

import { useEffect, useRef, useState } from "react";
import type { ParsedBook } from "@igot/parser";
import type { SelectionAction } from "@/lib/types";
import { useI18n } from "./I18nProvider";
import { translateStream, explainStream, ask, type BookContext } from "@/lib/ai-client";

interface AIPanelProps {
  action: SelectionAction | null;
  book: ParsedBook;
  onClose: () => void;
  /** Salvar a resposta atual como anotação. */
  onSaveNote?: (entry: { kind: "translate" | "explain" | "ask"; source: string; result: string; chapterId?: string }) => void;
}

interface PanelState {
  loading: boolean;
  result: string | null;
  error: string | null;
}

/**
 * Painel lateral da IA.
 *
 * Quando recebe uma `action` (Traduzir/Explicar), chama o ai-client (que
 * fala com o provedor escolhido pelo usuário, via proxy) e mostra o resultado.
 */
export function AIPanel({ action, book, onClose, onSaveNote }: AIPanelProps) {
  const { t } = useI18n();
  const [state, setState] = useState<PanelState>({
    loading: false,
    result: null,
    error: null,
  });
  const [query, setQuery] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const bookCtx: BookContext = {
    bookTitle: book.title,
    bookAuthor: book.author,
    bookLanguage: book.language,
  };

  // Quando o painel é fechado (action → null), limpa o estado interno pra
  // não mostrar resultado/erro antigo na próxima abertura.
  useEffect(() => {
    if (action === null) {
      setState({ loading: false, result: null, error: null });
      setQuery("");
    }
  }, [action]);

  // Dispara a ação (traduzir/explicar) quando ela muda — com STREAMING.
  useEffect(() => {
    if (!action) return;

    let cancelled = false;
    setState({ loading: true, result: null, error: null });

    const run = async () => {
      // onChunk atualiza o resultado aos poucos (streaming) — o usuário vê
      // o texto ir aparecendo palavra por palavra.
      const onChunk = (full: string) => {
        if (cancelled) return;
        setState({ loading: false, result: full, error: null });
      };

      const res =
        action.type === "translate"
          ? await translateStream(action.text, bookCtx, onChunk)
          : await explainStream(action.text, bookCtx, onChunk);

      if (cancelled) return;
      if (res.ok && res.text) {
        setState({ loading: false, result: res.text, error: null });
        // AUTO-SAVE: toda tradução/explicação é salva automaticamente nas notas.
        onSaveNote?.({
          kind: action.type,
          source: action.text,
          result: res.text,
          chapterId: action.chapterId,
        });
      } else {
        setState({ loading: false, result: null, error: res.error ?? "Erro." });
      }
    };
    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  // Rola pro fim quando o resultado chega.
  useEffect(() => {
    if (state.result) {
      resultRef.current?.scrollTo({ top: resultRef.current.scrollHeight });
    }
  }, [state.result]);

  // Pergunta livre ao livro.
  const askBook = async () => {
    const q = query.trim();
    if (!q) return;

    setState({ loading: true, result: null, error: null });
    const res = await ask(q, bookCtx);
    setState(
      res.ok
        ? { loading: false, result: res.text ?? null, error: null }
        : { loading: false, result: null, error: res.error ?? "Erro." },
    );
    setQuery("");
  };

  const title =
    action?.type === "translate"
      ? t("reader_note_translate")
      : action?.type === "explain"
        ? t("reader_note_explain")
        : t("reader_note_question");

  return (
    <aside className="ai-panel">
      <header className="ai-header">
        <span className="ai-title">{action ? title : t("ai_assistant")}</span>
        <div className="ai-header-actions">
          {state.result && action && (
            <button
              className="ai-save"
              onClick={() =>
                onSaveNote?.({
                  kind: action.type,
                  source: action.text,
                  result: state.result ?? "",
                  chapterId: action.chapterId,
                })
              }
              title={t("ai_save_tooltip")}
            >
              {t("ai_save")}
            </button>
          )}
          {/* ✕ SEMPRE visível — usuário pode desistir/fechar a qualquer momento,
              inclusive durante o loading (não fica "presa"). */}
          <button
            className="ai-close"
            onClick={onClose}
            aria-label={t("close")}
            title={t("close")}
          >
            ✕
          </button>
        </div>
      </header>

      <div className="ai-body" ref={resultRef}>
        {!action && !state.result && (
          <div className="ai-empty">
            <p>{t("ai_empty_hint")}</p>
            <p className="ai-empty-sub">{t("ai_empty_sub")}</p>
          </div>
        )}

        {state.loading && (
          <div className="ai-loading">
            <div className="ai-loading-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <span className="ai-loading-label">
              {action?.type === "translate" ? t("reader_translating") : t("reader_explaining")}
            </span>
          </div>
        )}

        {state.error && <p className="ai-error">⚠️ {state.error}</p>}

        {state.result && <div className="ai-result">{state.result}</div>}
      </div>

      <footer className="ai-footer">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askBook()}
          placeholder={t("ai_ask_placeholder", { title: truncate(book.title, 28) })}
        />
        <button onClick={askBook} disabled={!query.trim()}>
          ➤
        </button>
      </footer>

      <style jsx>{`
        .ai-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--surface);
        }
        .ai-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid var(--border);
        }
        .ai-title {
          font-weight: 600;
          font-size: 15px;
        }
        .ai-close {
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 24px;
          line-height: 1;
          padding: 0 4px;
        }
        .ai-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ai-save {
          border: 1px solid var(--border);
          background: var(--surface-alt);
          color: var(--text);
          border-radius: 6px;
          font-size: 12px;
          padding: 4px 10px;
          cursor: pointer;
        }
        .ai-save:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .ai-body {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          min-height: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ai-empty {
          color: var(--text-muted);
          text-align: center;
          margin-top: 40px;
        }
        .ai-empty p {
          margin: 0 0 8px;
        }
        .ai-empty-sub {
          font-size: 13px;
        }
        .ai-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          padding: 16px 0;
        }
        .ai-loading-dots {
          display: flex;
          gap: 6px;
        }
        .ai-loading-label {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          opacity: 0.4;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .ai-error {
          margin: 0;
          padding: 12px;
          background: var(--accent-soft);
          border-radius: 8px;
          color: var(--accent);
          font-size: 14px;
        }
        .ai-result {
          font-size: var(--text-base);
          line-height: 1.7;
          white-space: pre-wrap;
          padding: 4px 0;
        }
        .ai-result :global(strong) {
          font-weight: 600;
          color: var(--text);
        }
        .ai-result :global(em) {
          font-style: italic;
          color: var(--text-muted);
        }
        .ai-footer {
          display: flex;
          gap: 8px;
          padding: 14px 20px;
          border-top: 1px solid var(--border);
        }
        .ai-footer input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
        }
        .ai-footer input:focus {
          outline: none;
          border-color: var(--accent);
        }
        .ai-footer button {
          width: 40px;
          border: none;
          background: var(--accent);
          color: white;
          border-radius: 8px;
          font-size: 16px;
        }
        .ai-footer button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </aside>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

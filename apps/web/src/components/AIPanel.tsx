"use client";

import { useEffect, useRef, useState } from "react";
import type { ParsedBook } from "@igot/parser";
import type { SelectionAction } from "@/lib/types";

interface AIPanelProps {
  action: SelectionAction | null;
  book: ParsedBook;
  onClose: () => void;
}

interface PanelState {
  loading: boolean;
  result: string | null;
  error: string | null;
}

/**
 * Painel lateral da IA.
 *
 * Quando recebe uma `action` (Traduzir/Explicar), chama a API Route
 * correspondente e mostra o resultado com streaming de texto.
 */
export function AIPanel({ action, book, onClose }: AIPanelProps) {
  const [state, setState] = useState<PanelState>({
    loading: false,
    result: null,
    error: null,
  });
  const [query, setQuery] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  // Dispara a ação quando muda.
  useEffect(() => {
    if (!action) return;

    let cancelled = false;
    setState({ loading: true, result: null, error: null });

    const endpoint = action.type === "translate" ? "/api/translate" : "/api/explain";

    (async () => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: action.text,
            targetLang: action.targetLang,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookLanguage: book.language,
          }),
        });
        const data = (await res.json()) as { ok: boolean; text?: string; error?: string };
        if (cancelled) return;
        if (data.ok && data.text) {
          setState({ loading: false, result: data.text, error: null });
        } else {
          setState({ loading: false, result: null, error: data.error ?? "Erro desconhecido." });
        }
      } catch (err) {
        if (cancelled) return;
        setState({
          loading: false,
          result: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [action, book.title, book.author, book.language]);

  // Rola pro fim enquanto chega o resultado (sensação de streaming).
  useEffect(() => {
    if (state.result) {
      resultRef.current?.scrollTo({ top: resultRef.current.scrollHeight });
    }
  }, [state.result]);

  // Pergunta livre ao livro (preview do Q&A da Fase 2 — sem RAG ainda).
  const askBook = async () => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    setState({ loading: true, result: null, error: null });

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          bookTitle: book.title,
          bookAuthor: book.author,
          bookLanguage: book.language,
        }),
      });
      const data = (await res.json()) as { ok: boolean; text?: string; error?: string };
      if (cancelled) return;
      if (data.ok && data.text) {
        setState({ loading: false, result: data.text, error: null });
      } else {
        setState({ loading: false, result: null, error: data.error ?? "Erro desconhecido." });
      }
    } catch (err) {
      if (cancelled) return;
      setState({
        loading: false,
        result: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    setQuery("");
  };

  const title =
    action?.type === "translate"
      ? "🌐 Tradução"
      : action?.type === "explain"
        ? "🧠 Explicação"
        : "❓ Resposta";

  return (
    <aside className="ai-panel">
      <header className="ai-header">
        <span className="ai-title">{action ? title : "🧠 Assistente igot"}</span>
        {action && (
          <button className="ai-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        )}
      </header>

      <div className="ai-body" ref={resultRef}>
        {!action && !state.result && (
          <div className="ai-empty">
            <p>
              Selecione um trecho do texto e escolha{" "}
              <strong>Traduzir</strong> ou <strong>Explicar</strong>.
            </p>
            <p className="ai-empty-sub">
              Ou faça uma pergunta sobre o livro abaixo.
            </p>
          </div>
        )}

        {action?.text && (
          <div className="ai-selection">
            <span className="ai-selection-label">Você selecionou:</span>
            <blockquote>{action.text}</blockquote>
          </div>
        )}

        {state.loading && (
          <div className="ai-loading">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}

        {state.error && (
          <p className="ai-error">⚠️ {state.error}</p>
        )}

        {state.result && (
          <div className="ai-result">{state.result}</div>
        )}
      </div>

      <footer className="ai-footer">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askBook()}
          placeholder={`Pergunte sobre "${truncate(book.title, 28)}"…`}
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
        .ai-body {
          flex: 1;
          overflow-y: auto;
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
        .ai-selection-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ai-selection blockquote {
          margin: 6px 0 0;
          padding: 10px 14px;
          background: var(--surface-alt);
          border-radius: 8px;
          border-left: 3px solid var(--accent);
          font-style: italic;
          font-size: 14px;
        }
        .ai-loading {
          display: flex;
          gap: 6px;
          padding: 8px 0;
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
          font-size: 15px;
          line-height: 1.65;
          white-space: pre-wrap;
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

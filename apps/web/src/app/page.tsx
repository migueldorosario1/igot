"use client";

import { useCallback, useRef, useState } from "react";
import type { ParsedBook } from "@igot/parser";
import { parseBook } from "@igot/parser";
import { Uploader } from "@/components/Uploader";
import { Reader } from "@/components/Reader";
import { AIPanel } from "@/components/AIPanel";
import type { SelectionAction } from "@/lib/types";

/**
 * Página principal do igot.
 *
 * Layout de dois painéis:
 *   ┌────────────────────┬──────────────────┐
 *   │   Reader (livro)   │   AIPanel (IA)   │
 *   └────────────────────┴──────────────────┘
 *
 * Fluxo: upload → parse → leitura → seleciona texto → IA ajuda.
 */
export default function HomePage() {
  const [book, setBook] = useState<ParsedBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<SelectionAction | null>(null);

  // Referência estável pra não reparsear o mesmo arquivo.
  const lastFileRef = useRef<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (lastFileRef.current === `${file.name}:${file.size}`) return;
    lastFileRef.current = `${file.name}:${file.size}`;

    setLoading(true);
    setError(null);
    setAction(null);

    try {
      const data = await file.arrayBuffer();
      const result = await parseBook({ data, fileName: file.name });
      if (result.ok) {
        setBook(result.book);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelection = useCallback((a: SelectionAction) => {
    setAction(a);
  }, []);

  const handleClosePanel = useCallback(() => setAction(null), []);

  return (
    <main className="igot-shell">
      {!book && !loading && (
        <Uploader onFile={handleFile} error={error} />
      )}

      {loading && (
        <div className="igot-loading">
          <div className="spinner" aria-hidden />
          <p>Analisando o livro…</p>
        </div>
      )}

      {book && (
        <div className="igot-workspace">
          <Reader book={book} onSelection={handleSelection} />
          <AIPanel
            action={action}
            book={book}
            onClose={handleClosePanel}
          />
        </div>
      )}

      <style jsx>{`
        .igot-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .igot-workspace {
          display: grid;
          grid-template-columns: 1fr 420px;
          flex: 1;
          min-height: 0;
        }
        .igot-loading {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-muted);
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (max-width: 900px) {
          .igot-workspace {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

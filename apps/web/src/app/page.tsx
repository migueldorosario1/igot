"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { ParsedBook } from "@igot/parser";
import { parseBook } from "@igot/parser";
import { Uploader } from "@/components/Uploader";
import { Reader } from "@/components/Reader";
import { AIPanel } from "@/components/AIPanel";
import { getConfig } from "@/lib/config";
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
 * A IA só funciona depois de configurada em /settings (BYOK).
 */
export default function HomePage() {
  const [book, setBook] = useState<ParsedBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<SelectionAction | null>(null);
  const [configReady, setConfigReady] = useState(false);

  // Lê a config UMA vez na montagem (evita flicker de hidratação).
  const bootRef = useRef(false);
  if (!bootRef.current) {
    bootRef.current = true;
    setConfigReady(getConfig() !== null);
  }

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
      <TopBar configReady={configReady} />

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
          <AIPanel action={action} book={book} onClose={handleClosePanel} />
        </div>
      )}

      <style jsx>{`
        .igot-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        :global(.igot-topbar) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          flex-shrink: 0;
        }
        :global(.igot-topbar .brand) {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 18px;
        }
        :global(.igot-topbar .brand span) {
          background: linear-gradient(135deg, var(--accent), #e8a03d);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        :global(.igot-topbar .gear) {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          background: var(--bg);
          border-radius: 8px;
          font-size: 16px;
          color: var(--text);
          text-decoration: none;
          position: relative;
        }
        :global(.igot-topbar .gear:hover) {
          border-color: var(--accent);
        }
        :global(.igot-topbar .gear.unset)::after {
          content: "";
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
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

/** Barra superior com a marca e o atalho pra Configurações. */
function TopBar({ configReady }: { configReady: boolean }) {
  return (
    <div className="igot-topbar">
      <div className="brand">
        💡 <span>igot</span>
      </div>
      <Link
        href="/settings"
        className={`gear ${configReady ? "" : "unset"}`}
        title={configReady ? "Configurações de IA" : "Configurar IA"}
      >
        ⚙️
      </Link>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Uploader } from "@/components/Uploader";
import { SettingsModal } from "@/components/SettingsModal";
import { AuthButton } from "@/components/AuthButton";
import { hasConfig } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { listLibrary, saveToLibrary } from "@/lib/repository";
import { parseBook } from "@igot/parser";
import type { Session } from "@/lib/db";

/**
 * Home = ESTANTE.
 *
 * Mostra os livros da biblioteca em grid de capas. Logo "igot" é clicável
 * (volta pra cá). Clicar num livro vai pra /book/[id] (URL própria).
 * Botão "+ Adicionar" abre o Uploader.
 */
export default function HomePage() {
  const router = useRouter();
  const auth = useAuth();
  const [books, setBooks] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingBook, setAddingBook] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [configReady, setConfigReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Carrega a estante.
  const refresh = useCallback(async () => {
    const list = await listLibrary(auth.userId).catch(() => []);
    setBooks(list);
    setLoading(false);
  }, [auth.userId]);

  useEffect(() => {
    setConfigReady(hasConfig());
    refresh();
  }, [refresh]);

  // Abre um arquivo novo → salva na estante → navega pra /book/[id].
  const handleFile = useCallback(
    async (file: File) => {
      setAddingBook(true);
      setUploadError(null);
      try {
        const data = await file.arrayBuffer();
        const result = await parseBook({ data: data.slice(0), fileName: file.name });
        if (result.ok) {
          const bookId = `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
          const session: Session = {
            id: bookId,
            fileName: file.name,
            fileSize: file.size,
            book: result.book,
            pdfSource: result.book.sourceFormat === "pdf" ? new Uint8Array(data) : null,
            chapterIdx: 0,
            zoom: 1,
            savedAt: Date.now(),
            translations: {},
            notes: [],
          };
          await saveToLibrary(session, auth.userId);
          router.push(`/book/${bookId}`);
        } else {
          setUploadError(result.error);
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : String(err));
      } finally {
        setAddingBook(false);
      }
    },
    [auth.userId, router],
  );

  return (
    <main className="igot-shell">
      {/* TopBar com logo clicável */}
      <div className="igot-topbar">
        <div className="brand" title="Estante">
          💡 <span>igot</span>
        </div>
        <div className="igot-topbar-actions">
          <AuthButton
            status={auth.status}
            userName={auth.user?.user_metadata?.full_name ?? null}
            avatarUrl={auth.user?.user_metadata?.avatar_url ?? null}
            onSignIn={auth.signInWithGoogle}
            onSignOut={auth.signOut}
          />
          <button
            className={`gear ${configReady ? "" : "unset"}`}
            onClick={() => setSettingsOpen(true)}
            aria-label="Configurações de IA"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Estante */}
      {loading ? (
        <div className="igot-loading">
          <div className="spinner" />
          <p>Carregando sua estante…</p>
        </div>
      ) : books.length === 0 && !addingBook ? (
        <Uploader
          onFile={handleFile}
          error={uploadError}
          configReady={configReady}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <div className="shelf-page">
          <div className="shelf-header">
            <h1>Minha estante</h1>
            <button className="add-book-btn" onClick={() => document.getElementById("file-input")?.click()}>
              + Adicionar livro
            </button>
            <input
              id="file-input"
              type="file"
              accept=".epub,.pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {addingBook && (
            <div className="igot-loading">
              <div className="spinner" />
              <p>Adicionando livro…</p>
            </div>
          )}

          {uploadError && (
            <p className="shelf-error">⚠️ {uploadError}</p>
          )}

          <div className="shelf-grid">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="book-card"
              >
                <div className="book-cover">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt="" />
                  ) : (
                    <div className="book-cover-placeholder">
                      <span className="book-cover-icon">📖</span>
                      <span className="book-cover-format">{book.book.sourceFormat.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="book-info">
                  <h3 className="book-title">{book.book.title}</h3>
                  {book.book.author && (
                    <p className="book-author">{book.book.author}</p>
                  )}
                  <p className="book-progress">
                    {book.book.sourceFormat === "pdf"
                      ? `Página ${book.chapterIdx + 1}`
                      : `Capítulo ${book.chapterIdx + 1}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={() => setConfigReady(hasConfig())}
        />
      )}

      <style jsx>{`
        .shelf-page {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px 80px;
        }
        .shelf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .shelf-header h1 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: 700;
        }
        .add-book-btn {
          padding: 8px 16px;
          border: 1px solid var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
          border-radius: 8px;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .add-book-btn:hover {
          background: var(--accent);
          color: white;
        }
        .shelf-error {
          padding: 10px 14px;
          background: #fdecea;
          border-radius: 8px;
          color: #c0392b;
          font-size: var(--text-sm);
          margin-bottom: 16px;
          border: 1px solid #f5b7b1;
        }
        .shelf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 20px;
        }
        .book-card {
          text-decoration: none;
          color: var(--text);
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: transform var(--transition);
        }
        .book-card:hover {
          transform: translateY(-3px);
        }
        .book-cover {
          aspect-ratio: 2 / 3;
          background: var(--surface-alt);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: var(--shadow);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .book-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .book-cover-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
        }
        .book-cover-icon {
          font-size: 36px;
        }
        .book-cover-format {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          background: var(--surface);
          border-radius: 4px;
        }
        .book-info {
          text-align: center;
        }
        .book-title {
          margin: 0;
          font-size: var(--text-sm);
          font-weight: 600;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .book-author {
          margin: 2px 0 0;
          font-size: var(--text-xs);
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .book-progress {
          margin: 2px 0 0;
          font-size: var(--text-xs);
          color: var(--accent);
          font-weight: 500;
        }
      `}</style>
    </main>
  );
}

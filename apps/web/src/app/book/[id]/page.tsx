"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Reader } from "@/components/Reader";
import { AIPanel } from "@/components/AIPanel";
import { SettingsModal } from "@/components/SettingsModal";
import { hasConfig, loadConfigCache } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { getBook } from "@/lib/repository";
import { saveToLibrary } from "@/lib/repository";
import type { Session } from "@/lib/db";
import type { SelectionAction } from "@/lib/types";

/**
 * Rota /book/[id] — abre um livro específico da estante.
 * Cada livro tem URL própria (compartilhável, voltável).
 */
export default function BookPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const auth = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [action, setAction] = useState<SelectionAction | null>(null);
  const [configReady, setConfigReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Carrega o livro pelo ID da URL.
  useEffect(() => {
    loadConfigCache().then(() => setConfigReady(hasConfig()));
    let cancelled = false;
    (async () => {
      const book = await getBook(params.id);
      if (cancelled) return;
      if (book) {
        setSession(book);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // Salva mudanças (página, zoom, traduções, notas) com debounce.
  useEffect(() => {
    if (!session || loading) return;
    const t = setTimeout(() => {
      const updated = { ...session, savedAt: Date.now() };
      saveToLibrary(updated, auth.userId).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [session, loading, auth.userId]);

  const handleSelection = (a: SelectionAction) => setAction(a);
  const handleClosePanel = () => setAction(null);

  const updateSession = (patch: Partial<Session>) =>
    setSession((prev) => (prev ? { ...prev, ...patch } : prev));

  if (loading) {
    return (
      <main className="igot-shell">
        <div className="igot-loading">
          <div className="spinner" />
          <p>Abrindo livro…</p>
        </div>
      </main>
    );
  }

  if (notFound || !session) {
    return (
      <main className="igot-shell">
        <div className="igot-loading">
          <p>Livro não encontrado na sua estante.</p>
          <button onClick={() => router.push("/")} className="back-btn">
            ← Voltar pra estante
          </button>
        </div>
      </main>
    );
  }

  // Reconstrói o ArrayBuffer a partir do Uint8Array (cópia defensiva).
  let pdfSource: ArrayBuffer | null = null;
  if (session.pdfSource) {
    const copy = new ArrayBuffer(session.pdfSource.byteLength);
    new Uint8Array(copy).set(session.pdfSource);
    pdfSource = copy;
  }

  return (
    <main className="igot-shell">
      <div className="igot-workspace igot-workspace-no-topbar">
        <Reader
          book={session.book}
          pdfSource={pdfSource}
          onSelection={handleSelection}
          initialChapterIdx={session.chapterIdx}
          initialZoom={session.zoom}
          onChapterChange={(n) => updateSession({ chapterIdx: n })}
          onZoomChange={(z) => updateSession({ zoom: z })}
          onCloseBook={() => router.push("/")}
          auth={auth}
          onOpenSettings={() => setSettingsOpen(true)}
          configReady={configReady}
          translations={session.translations ?? {}}
          onPageTranslation={(chapIdx, text) => {
            const key = String(chapIdx + 1);
            updateSession({
              translations: { ...(session.translations ?? {}), [key]: text },
            });
          }}
          notes={session.notes ?? []}
          onRemoveNote={(id) =>
            updateSession({
              notes: (session.notes ?? []).filter((n) => n.id !== id),
            })
          }
          onSaveNote={(entry) =>
            updateSession({
              notes: [
                {
                  ...entry,
                  id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  savedAt: Date.now(),
                },
                ...(session.notes ?? []),
              ],
            })
          }
          bookmarks={session.bookmarks ?? []}
          onToggleBookmark={(chapIdx) => {
            const existing = session.bookmarks ?? [];
            const has = existing.some((b) => b.chapterIdx === chapIdx);
            updateSession({
              bookmarks: has
                ? existing.filter((b) => b.chapterIdx !== chapIdx)
                : [...existing, { chapterIdx: chapIdx, savedAt: Date.now() }],
            });
          }}
          onGoToShelf={() => {
            // Avisa a home que viemos clicando em "estante" (não auto-abre livro).
            sessionStorage.setItem("igot.backToEstante", "1");
            router.push("/");
          }}
        />
        <AIPanel
          action={action}
          book={session.book}
          onClose={handleClosePanel}
          onSaveNote={(entry) =>
            updateSession({
              notes: [
                {
                  ...entry,
                  id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  savedAt: Date.now(),
                },
                ...(session.notes ?? []),
              ],
            })
          }
        />
      </div>
      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={() => setConfigReady(hasConfig())}
        />
      )}
      <style jsx>{`
        .back-btn {
          margin-top: 16px;
          padding: 8px 16px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--accent);
          border-radius: 8px;
          cursor: pointer;
        }
      `}</style>
    </main>
  );
}


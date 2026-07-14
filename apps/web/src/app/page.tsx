"use client";

import { useEffect, useState } from "react";
import { Uploader } from "@/components/Uploader";
import { Reader } from "@/components/Reader";
import { AIPanel } from "@/components/AIPanel";
import { SettingsModal } from "@/components/SettingsModal";
import { AuthButton } from "@/components/AuthButton";
import { hasConfig } from "@/lib/config";
import { useSession } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import type { SelectionAction } from "@/lib/types";

/**
 * Página principal do igot.
 *
 * A sessão de leitura (livro, página atual, zoom) é persistida via
 * `useSession`. Logado → Supabase (nuvem, sincroniza entre dispositivos).
 * Deslogado → IndexedDB (local). As notas, traduções e progresso
 * acompanham o usuário quando ele entra com Google.
 *
 * A chave de IA (BYOK) NUNCA vai pra nuvem — fica no localStorage por device.
 */
export default function HomePage() {
  const auth = useAuth();
  const session = useSession(auth.userId);
  const { booting, book, pdfSource, chapterIdx, zoom } = session;

  const [action, setAction] = useState<SelectionAction | null>(null);
  const [configReady, setConfigReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Lê config no boot — SEMPRE em useEffect (nunca durante o render).
  // No SSR/build não há window, então tem que ser lazy.
  useEffect(() => {
    setConfigReady(hasConfig());
  }, []);

  const handleSelection = (a: SelectionAction) => setAction(a);
  const handleClosePanel = () => setAction(null);

  return (
    <main className="igot-shell">
      <TopBar
        configReady={configReady}
        onOpenSettings={() => setSettingsOpen(true)}
        auth={auth}
      />

      {booting && (
        <div className="igot-loading">
          <div className="spinner" aria-hidden />
          <p>Carregando sua leitura…</p>
        </div>
      )}

      {!booting && !book && !session.loading && (
        <Uploader onFile={session.openBook} error={session.error} />
      )}

      {!booting && session.loading && (
        <div className="igot-loading">
          <div className="spinner" aria-hidden />
          <p>Analisando o livro…</p>
        </div>
      )}

      {!booting && book && (
        <div className="igot-workspace">
          <Reader
            book={book}
            pdfSource={pdfSource}
            onSelection={handleSelection}
            initialChapterIdx={chapterIdx}
            initialZoom={zoom}
            onChapterChange={session.setChapterIdx}
            onZoomChange={session.setZoom}
            onCloseBook={session.closeBook}
            translations={session.translations}
            onPageTranslation={session.setPageTranslation}
            notes={session.notes}
            onRemoveNote={session.removeNote}
          />
          <AIPanel
            action={action}
            book={book}
            onClose={handleClosePanel}
            onSaveNote={session.addNote}
          />
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={() => setConfigReady(hasConfig())}
        />
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
          position: relative;
          cursor: pointer;
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

/** Barra superior com a marca e o botão ⚙️ que abre o modal de settings. */
function TopBar({
  configReady,
  onOpenSettings,
  auth,
}: {
  configReady: boolean;
  onOpenSettings: () => void;
  auth: ReturnType<typeof useAuth>;
}) {
  return (
    <div className="igot-topbar">
      <div className="brand">
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
          onClick={onOpenSettings}
          title={configReady ? "Configurações de IA" : "Configurar IA"}
          aria-label="Configurações de IA"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}

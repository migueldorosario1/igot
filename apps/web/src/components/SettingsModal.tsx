"use client";

import { useEffect, useState } from "react";
import type { AIConfig } from "@igot/ai-providers";
import { getConfigSync, loadConfigCache } from "@/lib/config";
import { SettingsForm } from "./SettingsForm";

interface SettingsModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Modal de Configurações de IA — abre por cima do livro, sem sair da leitura.
 *
 * - Backdrop escuro (clique fora fecha)
 * - Card central reusando o `<SettingsForm>`
 * - Fecha com ESC
 *
 * A config inicial é lida FRESCA a cada abertura (pra refletir um save anterior).
 */
export function SettingsModal({ onClose, onSaved }: SettingsModalProps) {
  const [config, setConfig] = useState<AIConfig | null>(null);

  // Lê a config quando monta (garante que o cache tá carregado).
  useEffect(() => {
    loadConfigCache().then(() => setConfig(getConfigSync()));
  }, []);

  // Fecha com ESC.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="settings-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Configurações de IA"
    >
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <header className="settings-modal-header">
          <h2>⚙️ Configurações de IA</h2>
          <button
            className="settings-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>
        <div className="settings-modal-body">
          <SettingsForm
            initial={config}
            onSaved={() => {
              setConfig(getConfigSync());
              onSaved?.();
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }
        .settings-modal {
          background: var(--bg);
          border-radius: 14px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .settings-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 1;
        }
        .settings-modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }
        .settings-modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: var(--surface-alt);
          color: var(--text-muted);
          border-radius: 50%;
          font-size: 14px;
          cursor: pointer;
        }
        .settings-modal-close:hover {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .settings-modal-body {
          padding: 24px;
        }
        @media (max-width: 600px) {
          .settings-overlay {
            padding: 0;
          }
          .settings-modal {
            max-height: 100vh;
            height: 100vh;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}

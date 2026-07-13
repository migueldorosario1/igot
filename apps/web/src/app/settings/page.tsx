"use client";

import { useState } from "react";
import Link from "next/link";
import type { AIConfig } from "@igot/ai-providers";
import { getConfig } from "@/lib/config";
import { SettingsForm } from "@/components/SettingsForm";

/**
 * Página /settings — configuração de IA (BYOK).
 *
 * O usuário escolhe provedor e cola a própria chave. Como getConfig() lê
 * localStorage (só existe no cliente), usamos useState inicializado em null
 * e populamos no primeiro efeito de montagem.
 */
export default function SettingsPage() {
  const [config, setConfigState] = useState<AIConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  // Lê localStorage só depois de montar (evita mismatch de hidratação).
  if (!mounted) {
    setMounted(true);
    setConfigState(getConfig());
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <Link href="/" className="back">
          ‹ Voltar
        </Link>
        <h1>⚙️ Configurações de IA</h1>
      </header>

      <div className="settings-card">
        <p className="intro">
          O igot é agnóstico de provedor: escolha a IA que preferir e use sua
          própria chave. Sua configuração fica neste navegador — você está no
          controle.
        </p>
        <SettingsForm initial={config} onSaved={() => setConfigState(getConfig())} />
      </div>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          max-width: 640px;
          margin: 0 auto;
          padding: 24px 24px 80px;
        }
        .settings-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
        }
        .back {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
        }
        .back:hover {
          color: var(--accent);
        }
        .settings-header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
        }
        .settings-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px;
          box-shadow: var(--shadow);
        }
        .intro {
          margin: 0 0 24px;
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.6;
        }
      `}</style>
    </main>
  );
}

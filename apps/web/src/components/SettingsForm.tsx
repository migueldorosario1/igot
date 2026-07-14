"use client";

import { useState } from "react";
import { PRESETS, type AIConfig } from "@igot/ai-providers";
import { setConfig, clearConfig, getTargetLang, setTargetLang } from "@/lib/config";
import { testConnection } from "@/lib/ai-client";

interface SettingsFormProps {
  /** Config inicial (se houver). */
  initial: AIConfig | null;
  /** Chamado ao salvar/limpar (pra página recarregar estado). */
  onSaved: () => void;
}

interface TestState {
  status: "idle" | "testing" | "ok" | "fail";
  message: string;
}

/**
 * Formulário de configuração de IA.
 * O usuário escolhe o provedor, cola a chave (opcionalmente sobrescreve
 * modelo/baseUrl), testa a conexão e salva. Tudo no navegador.
 */
export function SettingsForm({ initial, onSaved }: SettingsFormProps) {
  const [providerId, setProviderId] = useState(initial?.providerId ?? "zai");
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? "");
  const [targetLang, setLang] = useState(getTargetLang());
  const [showKey, setShowKey] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [test, setTest] = useState<TestState>({
    status: "idle",
    message: "",
  });
  const [saved, setSaved] = useState(false);

  const preset = PRESETS.find((p) => p.id === providerId);

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTest({ status: "fail", message: "Cole a chave primeiro." });
      return;
    }
    setTest({ status: "testing", message: "Testando…" });
    const config: AIConfig = {
      providerId,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
      baseUrl: baseUrl.trim() || undefined,
    };
    const result = await testConnection(config);
    setTest(
      result.ok
        ? { status: "ok", message: result.message }
        : { status: "fail", message: result.message },
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    const config: AIConfig = {
      providerId,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
      baseUrl: baseUrl.trim() || undefined,
    };
    setConfig(config);
    setTargetLang(targetLang);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    clearConfig();
    setApiKey("");
    setModel("");
    setBaseUrl("");
    setTest({ status: "idle", message: "" });
    onSaved();
  };

  return (
    <form className="settings-form" onSubmit={handleSave}>
      {/* Provedor */}
      <div className="field">
        <label htmlFor="provider">Provedor de IA</label>
        <select
          id="provider"
          value={providerId}
          onChange={(e) => {
            setProviderId(e.target.value);
            setTest({ status: "idle", message: "" });
          }}
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {preset?.description && (
          <p className="hint">{preset.description}</p>
        )}
        {preset?.keyUrl && (
          <p className="hint">
            Não tem chave?{" "}
            <a href={preset.keyUrl} target="_blank" rel="noreferrer">
              Obter uma →
            </a>
          </p>
        )}
      </div>

      {/* Chave */}
      <div className="field">
        <label htmlFor="apikey">Chave de API</label>
        <div className="key-row">
          <input
            id="apikey"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="cole sua chave aqui"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="ghost"
            onClick={() => setShowKey((s) => !s)}
            aria-label={showKey ? "Esconder chave" : "Mostrar chave"}
          >
            {showKey ? "🙈" : "👁"}
          </button>
        </div>
        <p className="hint privacy">
          🔒 Sua chave fica só neste navegador (localStorage). Nunca é enviada
          ao nosso servidor exceto para repassá-la ao provedor.
        </p>
      </div>

      {/* Idioma-alvo */}
      <div className="field">
        <label htmlFor="lang">Idioma das respostas</label>
        <select
          id="lang"
          value={targetLang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="zh">中文 (Mandarim)</option>
          <option value="ru">Русский</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
        </select>
      </div>

      {/* Avançado */}
      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setAdvancedOpen((o) => !o)}
        aria-expanded={advancedOpen}
      >
        {advancedOpen ? "▾" : "▸"} Avançado
      </button>
      {advancedOpen && (
        <div className="advanced">
          <div className="field">
            <label htmlFor="model">
              Modelo{" "}
              <span className="muted">
                (padrão: {preset?.defaultModel})
              </span>
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={preset?.defaultModel}
              spellCheck={false}
            />
          </div>
          <div className="field">
            <label htmlFor="baseurl">
              URL base{" "}
              <span className="muted">
                (padrão: {preset?.baseUrl})
              </span>
            </label>
            <input
              id="baseurl"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={preset?.baseUrl}
              spellCheck={false}
            />
            <p className="hint">
              Use para apontar a um servidor self-hosted (ex.: Ollama, LM Studio).
            </p>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="actions">
        <button type="submit" className="primary" disabled={!apiKey.trim()}>
          Salvar
        </button>
        <button type="button" onClick={handleTest} disabled={!apiKey.trim() || test.status === "testing"}>
          {test.status === "testing" ? "Testando…" : "Testar conexão"}
        </button>
        {initial && (
          <button type="button" className="danger" onClick={handleClear}>
            Limpar
          </button>
        )}
      </div>

      {saved && <p className="feedback ok">✓ Configuração salva.</p>}

      {test.status !== "idle" && test.status !== "testing" && (
        <p className={`feedback ${test.status === "ok" ? "ok" : "err"}`}>
          {test.status === "ok" ? "✓ " : "⚠️ "}
          {test.message}
        </p>
      )}

      <style jsx>{`
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field label {
          font-size: 14px;
          font-weight: 600;
        }
        .field input,
        .field select {
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
        }
        .field input:focus,
        .field select:focus {
          outline: none;
          border-color: var(--accent);
        }
        .key-row {
          display: flex;
          gap: 8px;
        }
        .key-row input {
          flex: 1;
          font-family: ui-monospace, "SF Mono", Consolas, monospace;
        }
        .ghost {
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 8px;
          padding: 0 14px;
          font-size: 16px;
        }
        .hint {
          margin: 0;
          font-size: 12.5px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .hint.privacy {
          background: var(--surface-alt);
          padding: 8px 10px;
          border-radius: 6px;
        }
        .hint a {
          color: var(--accent);
        }
        .advanced-toggle {
          align-self: flex-start;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          padding: 0;
        }
        .advanced {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: var(--surface-alt);
          border-radius: 8px;
        }
        .muted {
          font-weight: 400;
          color: var(--text-muted);
          font-size: 12px;
        }
        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .actions button {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 14px;
        }
        .actions button.primary {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
          font-weight: 600;
        }
        .actions button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .actions button.danger {
          color: var(--accent);
        }
        .feedback {
          margin: 0;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
        }
        .feedback.ok {
          background: #e6f4ea;
          color: #1e7e34;
          border: 1px solid #b7dfc1;
        }
        .feedback.err {
          background: #fdecea;
          color: #c0392b;
          border: 1px solid #f5b7b1;
        }
      `}</style>
    </form>
  );
}

"use client";

import { useState } from "react";
import { PRESETS, type AIConfig } from "@igot/ai-providers";
import { setConfig, clearConfig, getTargetLang, setTargetLang } from "@/lib/config";
import { testConnection, listModels } from "@/lib/ai-client";

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
  // Busca de modelos disponíveis do provedor.
  const [modelsList, setModelsList] = useState<string[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const preset = PRESETS.find((p) => p.id === providerId);

  /** Busca os modelos disponíveis no provedor (requer chave). */
  const handleListModels = async () => {
    if (!apiKey.trim()) {
      setModelsError("Cole a chave primeiro.");
      return;
    }
    setModelsLoading(true);
    setModelsError("");
    setModelsList(null);
    const config: AIConfig = {
      providerId,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
    };
    const result = await listModels(config);
    setModelsLoading(false);
    if (result.ok && result.models) {
      setModelsList(result.models);
    } else {
      setModelsError(result.error ?? "Não foi possível buscar os modelos.");
    }
  };

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
            setModelsList(null);
            setModelsError("");
            setModelSearch("");
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

      {/* Idioma das respostas */}
      <div className="field">
        <label htmlFor="lang">Idioma das traduções e explicações</label>
        <p className="hint" style={{ marginBottom: "8px" }}>
          A IA vai traduzir e explicar os textos neste idioma.
        </p>
        <select
          id="lang"
          value={targetLang}
          onChange={(e) => setLang(e.target.value)}
        >
          <optgroup label="Mais comuns">
            <option value="pt-BR">🇧🇷 Português (Brasil)</option>
            <option value="en">🇺🇸 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
          </optgroup>
          <optgroup label="Asiáticos">
            <option value="zh">🇨🇳 中文 (Chinês)</option>
            <option value="ja">🇯🇵 日本語 (Japonês)</option>
            <option value="ko">🇰🇷 한국어 (Coreano)</option>
            <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
            <option value="ar">🇸🇦 العربية (Árabe)</option>
          </optgroup>
          <optgroup label="Europeus">
            <option value="de">🇩🇪 Deutsch (Alemão)</option>
            <option value="it">🇮🇹 Italiano</option>
            <option value="nl">🇳🇱 Nederlands (Holandês)</option>
            <option value="ru">🇷🇺 Русский (Russo)</option>
            <option value="pl">🇵🇱 Polski (Polonês)</option>
            <option value="tr">🇹🇷 Türkçe (Turco)</option>
            <option value="uk">🇺🇦 Українська (Ucraniano)</option>
          </optgroup>
          <optgroup label="Outros">
            <option value="he">🇮🇱 עברית (Hebraico)</option>
            <option value="id">🇮🇩 Bahasa Indonesia</option>
            <option value="vi">🇻🇳 Tiếng Việt (Vietnamita)</option>
            <option value="th">🇹🇭 ไทย (Tailandês)</option>
          </optgroup>
        </select>
      </div>

      {/* Escolher modelos (antes "Avançado") */}
      <button
        type="button"
        className="advanced-toggle"
        onClick={() => setAdvancedOpen((o) => !o)}
        aria-expanded={advancedOpen}
      >
        {advancedOpen ? "▾" : "▸"} Escolher modelo
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
            <div className="model-row">
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={preset?.defaultModel}
                spellCheck={false}
              />
              <button
                type="button"
                className="ghost"
                onClick={handleListModels}
                disabled={modelsLoading || !apiKey.trim()}
                title="Buscar modelos disponíveis no provedor"
              >
                {modelsLoading ? "⏳" : "🔍"}
              </button>
            </div>

            {/* Lista de modelos encontrados (clicável) */}
            {modelsLoading && (
              <p className="hint">Buscando modelos disponíveis…</p>
            )}
            {modelsError && (
              <p className="hint" style={{ color: "#c0392b" }}>⚠️ {modelsError}</p>
            )}
            {modelsList && modelsList.length > 0 && (
              <div className="models-list">
                <input
                  type="text"
                  className="model-search"
                  placeholder="Filtrar modelos…"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                />
                <div className="models-scroll">
                  {modelsList
                    .filter((m) =>
                      m.toLowerCase().includes(modelSearch.toLowerCase()),
                    )
                    .map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`model-item ${model === m ? "selected" : ""}`}
                        onClick={() => setModel(m)}
                      >
                        {model === m && "✓ "}{m}
                      </button>
                    ))}
                </div>
              </div>
            )}
            {modelsList && modelsList.length === 0 && (
              <p className="hint">Nenhum modelo encontrado.</p>
            )}
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

      {/* Ajuda: o que é API, ranking de preços, link do provedor */}
      <details className="help-section">
        <summary>Precisa de ajuda? O que é uma chave de API?</summary>
        <div className="help-content">
          <p>
            Uma <strong>chave de API</strong> é como uma senha que te permite usar
            a inteligência artificial do provedor escolhido (Z.ai, OpenAI, DeepSeek, etc.).
            Você cria a chave no site do provedor, cola aqui, e o igot usa ela pra
            traduzir e explicar os textos. Sua chave fica <strong>só no seu dispositivo</strong>.
          </p>
          <p>
            <strong>Como conseguir uma chave (grátis):</strong>
          </p>
          <ul>
            <li>Clique no link "Obter uma →" acima (ao lado do nome do provedor)</li>
            <li>Crie uma conta no site do provedor</li>
            <li>Gere uma chave de API (API Key)</li>
            <li>Copie a chave e cole aqui no campo acima</li>
          </ul>
          <p>
            <strong>Comparação de preços dos provedores:</strong>{" "}
            <a href="https://openrouter.ai/pricing" target="_blank" rel="noreferrer">
              Ver ranking de preços (OpenRouter) →
            </a>
          </p>
        </div>
      </details>

      {/* Quem somos */}
      <div className="about-section">
        <details>
          <summary>Quem somos</summary>
          <div className="about-content">
            <p>
              <strong>igot</strong> — "Leia qualquer coisa. Entenda tudo."
            </p>
            <p>
              Um leitor de e-books com IA que traduz e explica qualquer trecho,
              em qualquer idioma. Desenvolvido por:
            </p>
            <p>
              <strong>Miguel do Rosário</strong><br />
              Cafezinho Media Group<br />
              Produtora de conteúdo e aplicativos<br />
              Niterói, RJ — Brasil<br />
              migueldorosario@gmail.com
            </p>
          </div>
        </details>
      </div>

      {/* Doação */}
      <div className="donate-section">
        <p className="donate-title">Gostou do igot? Apoie o projeto!</p>
        <div className="donate-options">
          <a
            href="https://www.paypal.com/donate?hosted_button_id=migueldorosario@gmail.com"
            target="_blank"
            rel="noreferrer"
            className="donate-btn paypal"
          >
            💙 PayPal
          </a>
          <button
            type="button"
            className="donate-btn pix"
            onClick={() => {
              navigator.clipboard?.writeText("migueldorosario2@gmail.com").then(() => {
                alert("PIX copiado: migueldorosario2@gmail.com");
              }).catch(() => {
                alert("PIX: migueldorosario2@gmail.com");
              });
            }}
          >
            🟢 PIX (copiar)
          </button>
        </div>
      </div>

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
        .model-row {
          display: flex;
          gap: 8px;
        }
        .model-row input {
          flex: 1;
          font-family: ui-monospace, "SF Mono", Consolas, monospace;
        }
        .models-list {
          margin-top: 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .model-search {
          width: 100%;
          padding: 8px 10px;
          border: none;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 13px;
        }
        .model-search:focus {
          outline: none;
          background: var(--bg);
        }
        .models-scroll {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .model-item {
          text-align: left;
          border: none;
          background: transparent;
          color: var(--text);
          padding: 8px 12px;
          font-size: 13px;
          font-family: ui-monospace, "SF Mono", Consolas, monospace;
          cursor: pointer;
          border-bottom: 1px solid var(--border);
        }
        .model-item:last-child {
          border-bottom: none;
        }
        .model-item:hover {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .model-item.selected {
          background: #e6f4ea;
          color: #1e7e34;
          font-weight: 600;
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

        /* Seção de ajuda */
        .help-section {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface-alt);
          padding: 0;
        }
        .help-section summary {
          padding: 12px 14px;
          cursor: pointer;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-muted);
          list-style: none;
        }
        .help-section summary::-webkit-details-marker {
          display: none;
        }
        .help-section summary::before {
          content: "▸ ";
        }
        .help-section[open] summary::before {
          content: "▾ ";
        }
        .help-content {
          padding: 0 14px 14px;
          font-size: var(--text-sm);
          line-height: 1.6;
          color: var(--text-muted);
        }
        .help-content p {
          margin: 0 0 8px;
        }
        .help-content ul {
          margin: 0 0 8px;
          padding-left: 20px;
        }
        .help-content a {
          color: var(--accent);
        }

        /* Quem somos */
        .about-section {
          border-top: 1px solid var(--border);
          padding-top: 12px;
        }
        .about-section summary {
          cursor: pointer;
          font-size: var(--text-xs);
          color: var(--text-muted);
          list-style: none;
        }
        .about-section summary::-webkit-details-marker {
          display: none;
        }
        .about-content {
          padding-top: 10px;
          font-size: var(--text-xs);
          line-height: 1.7;
          color: var(--text-muted);
        }
        .about-content p {
          margin: 0 0 8px;
        }

        /* Doação */
        .donate-section {
          text-align: center;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .donate-title {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 0 0 10px;
        }
        .donate-options {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .donate-btn {
          display: inline-block;
          padding: 8px 18px;
          text-decoration: none;
          border-radius: 20px;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          font-family: inherit;
        }
        .donate-btn.paypal {
          background: #0070ba;
          color: white;
          border: 1px solid #0070ba;
        }
        .donate-btn.paypal:hover {
          background: #005ea6;
        }
        .donate-btn.pix {
          background: #32bcad;
          color: white;
          border: 1px solid #32bcad;
        }
        .donate-btn.pix:hover {
          background: #25a89a;
        }
      `}</style>
    </form>
  );
}

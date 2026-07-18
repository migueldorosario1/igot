"use client";

import { useCallback, useRef, useState } from "react";
import { useI18n } from "./I18nProvider";

interface UploaderProps {
  onFile: (file: File) => void;
  error?: string | null;
  /** Se a IA está configurada (pra mostrar aviso de setup). */
  configReady?: boolean;
  /** Abre as configurações. */
  onOpenSettings?: () => void;
}

/**
 * Tela inicial (onboarding + upload).
 * Apresenta o app, explica o que faz, avisa se a IA não tá configurada,
 * e aceita .epub/.pdf por arrastar-soltar ou clique.
 */
export function Uploader({ onFile, error, configReady = true, onOpenSettings }: UploaderProps) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="uploader-page">
      <div className="uploader-card">
        {/* Hero */}
        <div className="hero">
          <div className="logo">☕</div>
          <h1 className="brand-name">Moka</h1>
          <p className="tagline">{t("app_tagline")}</p>
          <p className="subtitle">{t("upload_hero_desc")}</p>
        </div>

        {/* Features */}
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🌐</span>
            <span className="feature-text">{t("upload_feat_translate")}</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🧠</span>
            <span className="feature-text">{t("upload_feat_explain")}</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📄</span>
            <span className="feature-text">{t("upload_feat_formats")}</span>
          </div>
        </div>

        {/* Aviso: IA não configurada */}
        {!configReady && (
          <div className="setup-warning" onClick={onOpenSettings} role="button">
            <span className="setup-icon">⚠️</span>
            <div className="setup-content">
              <strong>{t("upload_config_needed")}</strong>
              <span>{t("upload_config_desc")}</span>
            </div>
            <span className="setup-arrow">⚙️ →</span>
          </div>
        )}

        {/* Dropzone */}
        <label
          className={`dropzone ${dragging ? "is-dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".epub,.pdf,application/epub+zip,application/pdf"
            onChange={handleChange}
            hidden
          />
          <div className="dropzone-inner">
            <div className="dropzone-icon" aria-hidden>
              📖
            </div>
            <p className="dropzone-title">
              {t("upload_dropzone")} <span>{t("upload_click")}</span>
            </p>
            <p className="dropzone-formats">{t("upload_format_hint")}</p>
          </div>
        </label>

        {error && (
          <p className="uploader-error" role="alert">
            ⚠️ {error}
          </p>
        )}

        {/* Badge de privacidade */}
        <div className="privacy-badge">
          🔒 <span>{t("upload_privacy")}</span>
        </div>

        {/* Links: Quem Somos + Privacidade */}
        <div className="uploader-links">
          <a href="/sobre">Quem Somos</a>
          <span>·</span>
          <a href="/privacidade">Privacidade</a>
        </div>
      </div>

      <style jsx>{`
        .uploader-page {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-y: auto;
        }
        .uploader-card {
          max-width: 480px;
          width: 100%;
          text-align: center;
        }

        /* Hero */
        .hero {
          margin-bottom: 28px;
        }
        .logo {
          font-size: 56px;
          line-height: 1;
          margin-bottom: 8px;
        }
        .brand-name {
          font-size: var(--text-2xl);
          font-weight: 700;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, var(--accent), #e8a03d);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .tagline {
          color: var(--text-muted);
          margin: 0 0 12px;
          font-size: var(--text-lg);
        }
        .subtitle {
          color: var(--text);
          margin: 0;
          font-size: var(--text-base);
          line-height: 1.6;
        }

        /* Features */
        .features {
          display: flex;
          justify-content: center;
          gap: var(--space-5);
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .feature-icon {
          font-size: 24px;
        }
        .feature-text {
          font-size: var(--text-sm);
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Aviso de configuração */
        .setup-warning {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: 12px 16px;
          background: #faf6ee;
          border: 1px solid #e8d090;
          border-radius: var(--radius);
          margin-bottom: 20px;
          cursor: pointer;
          transition: var(--transition);
          text-align: left;
        }
        .setup-warning:hover {
          border-color: var(--accent);
          box-shadow: var(--shadow);
        }
        .setup-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        .setup-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .setup-content strong {
          font-size: var(--text-sm);
          color: #a04020;
        }
        .setup-content span {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
        .setup-arrow {
          font-size: var(--text-sm);
          color: var(--accent);
          flex-shrink: 0;
        }

        /* Dropzone */
        .dropzone {
          display: block;
          padding: 40px 24px;
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          cursor: pointer;
          transition: border-color var(--transition), background var(--transition),
            transform var(--transition);
        }
        .dropzone:hover,
        .dropzone.is-dragging {
          border-color: var(--accent);
          background: var(--accent-soft);
          transform: scale(1.01);
        }
        .dropzone-icon {
          font-size: 36px;
          margin-bottom: var(--space-3);
        }
        .dropzone-title {
          margin: 0 0 4px;
          font-size: var(--text-base);
        }
        .dropzone-title span {
          color: var(--accent);
          font-weight: 600;
        }
        .dropzone-formats {
          margin: 0;
          color: var(--text-muted);
          font-size: var(--text-xs);
        }

        /* Erro */
        .uploader-error {
          margin: 16px 0 0;
          padding: 10px 14px;
          background: #faf0e8;
          border-radius: var(--radius);
          color: #a04020;
          font-size: var(--text-sm);
          text-align: left;
          border: 1px solid #e0c0a8;
        }

        /* Badge de privacidade */
        .privacy-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          margin-top: 28px;
          color: var(--text-muted);
          font-size: var(--text-xs);
          padding: 8px 14px;
          background: var(--surface-alt);
          border-radius: 20px;
          display: inline-flex;
        }
        .privacy-badge span {
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .features {
            gap: var(--space-4);
          }
        }
        .uploader-links {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
          font-size: 13px;
        }
        .uploader-links a {
          color: var(--accent);
          text-decoration: none;
        }
        .uploader-links a:hover {
          text-decoration: underline;
        }
        .uploader-links span {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";

interface UploaderProps {
  onFile: (file: File) => void;
  error?: string | null;
}

/**
 * Tela de boas-vindas + upload.
 * Aceita .epub e .pdf por arrastar-soltar ou clique.
 */
export function Uploader({ onFile, error }: UploaderProps) {
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
        <h1 className="logo">
          💡 <span>igot</span>
        </h1>
        <p className="tagline">Leia qualquer coisa. Entenda tudo.</p>

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
              Arraste um livro aqui ou <span>clique pra escolher</span>
            </p>
            <p className="dropzone-formats">EPUB ou PDF</p>
          </div>
        </label>

        {error && (
          <p className="uploader-error" role="alert">
            ⚠️ {error}
          </p>
        )}

        <p className="uploader-hint">
          O livro é processado no seu navegador. A IA só vê o trecho que você
          selecionar.
        </p>
      </div>

      <style jsx>{`
        .uploader-page {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .uploader-card {
          max-width: 520px;
          width: 100%;
          text-align: center;
        }
        .logo {
          font-size: 56px;
          margin: 0 0 4px;
          letter-spacing: -1px;
        }
        .logo span {
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent), #e8a03d);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .tagline {
          color: var(--text-muted);
          margin: 0 0 36px;
          font-size: 18px;
        }
        .dropzone {
          display: block;
          padding: 48px 24px;
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          background: var(--surface);
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .dropzone:hover,
        .dropzone.is-dragging {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .dropzone-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }
        .dropzone-title {
          margin: 0 0 4px;
          font-size: 16px;
        }
        .dropzone-title span {
          color: var(--accent);
          font-weight: 600;
        }
        .dropzone-formats {
          margin: 0;
          color: var(--text-muted);
          font-size: 13px;
        }
        .uploader-error {
          margin: 20px 0 0;
          padding: 12px 16px;
          background: var(--accent-soft);
          border-radius: var(--radius);
          color: var(--accent);
          font-size: 14px;
          text-align: left;
        }
        .uploader-hint {
          margin: 28px 0 0;
          color: var(--text-muted);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

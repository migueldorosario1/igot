"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renderiza UMA página real de PDF, fiel ao original (layout, tipografia,
 * imagens), com uma camada de texto selecionável por cima — de forma que o
 * fluxo Traduzir/Explicar do Reader continue funcionando.
 *
 * Arquitetura:
 *   <canvas>  → desenho da página (fiel ao PDF)
 *   <div text-layer> → <span>s transparentes com o texto, alinhados por cima
 *
 * O window.getSelection() do Reader enxerga os <span>s da text-layer como
 * texto normal, então o menu flutuante aparece no lugar certo.
 */

interface PdfPageCanvasProps {
  /** Buffer do PDF original (preservado em page.tsx). */
  data: ArrayBuffer;
  /** Número da página (1-based). */
  pageNum: number;
}

type Status = "loading" | "ready" | "error";

// Escala-alvo de largura, em CSS px. O canvas é redimensionado pra caber.
const TARGET_WIDTH = 900;

export function PdfPageCanvas({ data, pageNum }: PdfPageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  // Handles transitórios (pra cancelar em re-renders).
  const docRef = useRef<Awaited<ReturnType<typeof loadDoc>> | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const textLayerHandleRef = useRef<{ cancel: () => void } | null>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Carrega o documento UMA vez quando o `data` muda.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    loadDoc(data)
      .then((doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current = doc;
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      textLayerHandleRef.current?.cancel();
      docRef.current?.destroy();
      docRef.current = null;
    };
  }, [data]);

  // Renderiza a página quando muda `pageNum` ou o documento fica pronto.
  useEffect(() => {
    if (status !== "ready") return;

    const doc = docRef.current;
    const canvas = canvasRef.current;
    const textLayerDiv = textLayerRef.current;
    if (!doc || !canvas || !textLayerDiv) return;

    let cancelled = false;
    let localRenderTask: { cancel: () => void } | null = null;
    let localTextLayer: { cancel: () => void } | null = null;

    (async () => {
      try {
        const page = await doc.getPage(pageNum);

        // Calcula escala pra caber na largura-alvo.
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = TARGET_WIDTH / baseViewport.width;
        const viewport = page.getViewport({ scale });

        // Alta nitidez em telas Retina/iPad.
        const outputScale = window.devicePixelRatio || 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        // pdfjs 4.x exige --scale-factor na text-layer p/ alinhar os spans.
        textLayerDiv.style.setProperty("--scale-factor", String(scale));
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;
        // Limpa text-layer de render anterior.
        textLayerDiv.innerHTML = "";

        // Render do canvas (fiel ao PDF).
        const task = page.render({
          canvasContext: ctx,
          viewport,
          transform:
            outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        });
        localRenderTask = task;
        renderTaskRef.current = task;
        await task.promise;

        if (cancelled) return;

        // Camada de texto selecionável (a peça que mantém a IA funcionando).
        const TextLayerClass = await getTextLayerClass();
        const textContent = await page.getTextContent();
        if (cancelled) return;

        const textLayer = new TextLayerClass({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
        });
        localTextLayer = textLayer;
        textLayerHandleRef.current = textLayer;
        await textLayer.render();
      } catch (err) {
        if (cancelled) return;
        // RenderingCancelledException é esperada em re-renders; ignora.
        const msg = err instanceof Error ? err.message : String(err);
        if (!/cancelled/i.test(msg)) {
          setStatus("error");
          setErrorMsg(msg);
        }
      }
    })();

    return () => {
      cancelled = true;
      localRenderTask?.cancel();
      localTextLayer?.cancel();
    };
  }, [pageNum, status]);

  return (
    <div className="pdf-page-container" ref={containerRef}>
      {status === "loading" && (
        <div className="pdf-loading">
          <div className="pdf-spinner" />
          <span>Carregando página…</span>
        </div>
      )}
      {status === "error" && (
        <div className="pdf-error">⚠️ Não foi possível renderizar a página: {errorMsg}</div>
      )}
      <div className="pdf-page-wrapper">
        <canvas ref={canvasRef} className="pdf-canvas" />
        <div ref={textLayerRef} className="pdf-text-layer" />
      </div>
    </div>
  );
}

// ─── Helpers (lazy import + cache) ───────────────────────────────────────

/** Importa o pdfjs uma única vez e devolve getDocument + version. */
async function loadDoc(data: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) });
  const doc = await loadingTask.promise;
  return {
    getPage: (n: number) => doc.getPage(n),
    destroy: () => doc.destroy(),
  };
}

/** Importa a classe TextLayer (pdfjs 4.x). */
async function getTextLayerClass() {
  const pdfjs = await import("pdfjs-dist");
  return pdfjs.TextLayer;
}

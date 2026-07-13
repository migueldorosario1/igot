"use client";

import { useEffect } from "react";

/**
 * Registra o service worker depois que o app carrega.
 *
 * Roda só no cliente (client component). Em desenvolvimento, os SWs dão
 * pau com hot-reload, então só registramos em produção.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("Falha ao registrar SW:", err));
    };

    // Registra só depois da janela carregar pra não competir com recursos
    // importantes (recomendação do Google Workbox).
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}

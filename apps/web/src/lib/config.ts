/**
 * Persistência da config de IA no navegador (localStorage).
 *
 * BYOK local: o usuário cola a própria chave em /settings; ela fica neste PC.
 * O servidor nunca a vê persistida — só a recebe transitória no corpo do
 * proxy, repassando ao provedor.
 */

import type { AIConfig } from "@igot/ai-providers";

const STORAGE_KEY = "igot.aiConfig";
const LANG_KEY = "igot.targetLang";

/** Lê a config de IA do localStorage (ou null se não configurada). */
export function getConfig(): AIConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as AIConfig;
    if (!cfg.providerId || !cfg.apiKey) return null;
    return cfg;
  } catch {
    return null;
  }
}

/** Salva a config de IA. */
export function setConfig(config: AIConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** Remove a config (logout da IA). */
export function clearConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** True se há uma config mínima (providerId + apiKey). */
export function hasConfig(): boolean {
  return getConfig() !== null;
}

/** Idioma-alvo das respostas da IA (default pt-BR). */
export function getTargetLang(): string {
  if (typeof window === "undefined") return "pt-BR";
  return window.localStorage.getItem(LANG_KEY) ?? "pt-BR";
}

export function setTargetLang(lang: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANG_KEY, lang);
}

/**
 * Persistência da config de IA no navegador (localStorage) — AGORA CRIPTOGRAFADA.
 *
 * BYOK local: o usuário cola a própria chave em /settings; ela fica neste PC.
 * A chave de IA é criptografada (AES-GCM) antes de ir pro localStorage —
 * "guarda como segredo da própria mulher". Mesmo quem abre o localStorage
 * não vê a chave no texto legível.
 *
 * O servidor nunca a vê persistida — só a recebe transitória no corpo do
 * proxy, repassando ao provedor.
 */

import type { AIConfig } from "@igot/ai-providers";
import { encrypt, decrypt } from "./crypto";

const STORAGE_KEY = "igot.aiConfig";
const LANG_KEY = "igot.targetLang";

/** Cache em memória (descriptografado). null = ainda não carregou. */
let cachedConfig: AIConfig | null | undefined = undefined;

/** Inicializa o cache descriptografando do localStorage (async). */
async function ensureCache(): Promise<AIConfig | null> {
  if (cachedConfig !== undefined) return cachedConfig;
  if (typeof window === "undefined") {
    cachedConfig = null;
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedConfig = null;
      return null;
    }
    const parsed = JSON.parse(raw) as {
      providerId: string;
      apiKeyEnc?: string; // criptografada (novo formato)
      apiKey?: string; // texto cru (legado)
      model?: string;
      baseUrl?: string;
    };
    // Descriptografa a chave (ou usa legado se não tiver versão criptografada).
    let apiKey = "";
    if (parsed.apiKeyEnc) {
      apiKey = await decrypt(parsed.apiKeyEnc);
    } else if (parsed.apiKey) {
      // Legado: chave em texto cru. Migra pra criptografada na próxima gravação.
      apiKey = parsed.apiKey;
    }
    if (!parsed.providerId || !apiKey) {
      cachedConfig = null;
      return null;
    }
    cachedConfig = {
      providerId: parsed.providerId,
      apiKey,
      model: parsed.model,
      baseUrl: parsed.baseUrl,
    };
    return cachedConfig;
  } catch {
    cachedConfig = null;
    return null;
  }
}

/**
 * Lê a config de IA. É ASSÍNCRONA agora (precisa descriptografar).
 * Mantém cache em memória após a primeira chamada.
 */
export async function getConfig(): Promise<AIConfig | null> {
  return ensureCache();
}

/**
 * Versão SÍNCRONA — retorna o cache em memória (descriptografado).
 * Retorna null se o cache ainda não foi carregado (chame loadConfigCache primeiro).
 */
export function getConfigSync(): AIConfig | null {
  return cachedConfig ?? null;
}

/**
 * Carrega o cache descriptografando do localStorage. Chamar no boot do app
 * (useEffect). Depois disso, getConfigSync() funciona síncrono.
 */
export async function loadConfigCache(): Promise<void> {
  await ensureCache();
}

/** Salva a config de IA (criptografando a chave antes). */
export async function setConfig(config: AIConfig): Promise<void> {
  if (typeof window === "undefined") return;
  const apiKeyEnc = await encrypt(config.apiKey);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      providerId: config.providerId,
      apiKeyEnc,
      model: config.model,
      baseUrl: config.baseUrl,
    }),
  );
  // Atualiza o cache.
  cachedConfig = config;
}

/** Remove a config (logout da IA). */
export function clearConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  cachedConfig = null;
}

/** True se há uma config mínima (precisa checar cache; se não carregou, false). */
export function hasConfig(): boolean {
  return cachedConfig != null && cachedConfig !== undefined;
}

/** Marca que precisa recarregar o cache (chamar getConfig de novo). */
export function invalidateConfigCache(): void {
  cachedConfig = undefined;
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

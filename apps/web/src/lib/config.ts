/**
 * Persistência da config de IA no navegador (localStorage) — CRIPTOGRAFADA.
 *
 * MULTI-CHAVE: o usuário pode cadastrar uma chave pra CADA provedor
 * (DeepSeek, OpenAI, Together, etc). Todas ficam salvas e mascaradas na UI.
 * Um `activeProviderId` diz qual está em uso no momento.
 *
 * As chaves são criptografadas (AES-GCM) antes de ir pro localStorage —
 * "guarda como segredo da própria mulher". Mesmo quem abre o localStorage
 * não vê a chave no texto legível.
 *
 * O servidor nunca a vê persistida — só a recebe transitória no corpo do
 * proxy, repassando ao provedor.
 */

import type { AIConfig } from "@igot/ai-providers";
import { encrypt, decrypt } from "./crypto";

const VAULT_KEY = "igot.aiVault"; // novo formato: múltiplas chaves
const LEGACY_KEY = "igot.aiConfig"; // formato antigo: chave única
const LANG_KEY = "igot.targetLang";

/** Uma entrada por provedor. */
export interface ProviderEntry {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  savedAt: number;
}

/** O "cofre" de chaves: mapa providerId → entry + qual tá ativo. */
interface Vault {
  /** providerId → dados da chave. */
  entries: Record<string, {
    apiKeyEnc: string;
    model?: string;
    baseUrl?: string;
    savedAt: number;
  }>;
  /** Qual provedor está em uso agora. */
  activeProviderId: string | null;
}

/** Cache em memória (descriptografado). null = vazio; undefined = não carregou. */
let cachedVault: Record<string, ProviderEntry> | null | undefined = undefined;
let cachedActiveId: string | null = null;

/** Versão mascarada de uma chave pra exibir na UI (sk-***...abc). */
export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

/** Inicializa o cache descriptografando do localStorage (async). */
async function ensureCache(): Promise<void> {
  if (cachedVault !== undefined) return;
  if (typeof window === "undefined") {
    cachedVault = null;
    cachedActiveId = null;
    return;
  }
  try {
    const raw = window.localStorage.getItem(VAULT_KEY);
    if (raw) {
      // Formato novo (cofre de múltiplas chaves).
      const parsed = JSON.parse(raw) as Vault;
      const entries: Record<string, ProviderEntry> = {};
      for (const [pid, enc] of Object.entries(parsed.entries ?? {})) {
        try {
          const apiKey = await decrypt(enc.apiKeyEnc);
          entries[pid] = {
            apiKey,
            model: enc.model,
            baseUrl: enc.baseUrl,
            savedAt: enc.savedAt,
          };
        } catch {
          // chave corrompida — pula
        }
      }
      cachedVault = entries;
      cachedActiveId = parsed.activeProviderId;
      return;
    }

    // Migração do formato legado (chave única).
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as {
        providerId: string;
        apiKeyEnc?: string;
        apiKey?: string;
        model?: string;
        baseUrl?: string;
      };
      let apiKey = "";
      if (parsed.apiKeyEnc) apiKey = await decrypt(parsed.apiKeyEnc);
      else if (parsed.apiKey) apiKey = parsed.apiKey;
      if (parsed.providerId && apiKey) {
        cachedVault = {
          [parsed.providerId]: {
            apiKey,
            model: parsed.model,
            baseUrl: parsed.baseUrl,
            savedAt: Date.now(),
          },
        };
        cachedActiveId = parsed.providerId;
        // Já persiste no novo formato.
        await persistVault();
        // Limpa o legado.
        window.localStorage.removeItem(LEGACY_KEY);
        return;
      }
    }
    cachedVault = null;
    cachedActiveId = null;
  } catch {
    cachedVault = null;
    cachedActiveId = null;
  }
}

/** Grava o cofre no localStorage (criptografando todas as chaves). */
async function persistVault(): Promise<void> {
  if (typeof window === "undefined" || !cachedVault) return;
  const entries: Vault["entries"] = {};
  for (const [pid, entry] of Object.entries(cachedVault)) {
    entries[pid] = {
      apiKeyEnc: await encrypt(entry.apiKey),
      model: entry.model,
      baseUrl: entry.baseUrl,
      savedAt: entry.savedAt,
    };
  }
  const vault: Vault = { entries, activeProviderId: cachedActiveId };
  window.localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

/**
 * Lê a config ATIVA (do provedor em uso). Retorna null se nenhuma chave.
 * Assíncrona (descriptografa).
 */
export async function getConfig(): Promise<AIConfig | null> {
  await ensureCache();
  if (!cachedVault || !cachedActiveId) return null;
  const entry = cachedVault[cachedActiveId];
  if (!entry) return null;
  return {
    providerId: cachedActiveId,
    apiKey: entry.apiKey,
    model: entry.model,
    baseUrl: entry.baseUrl,
  };
}

/** Versão SÍNCRONA — retorna o cache da config ativa em memória. */
export function getConfigSync(): AIConfig | null {
  if (!cachedVault || !cachedActiveId) return null;
  const entry = cachedVault[cachedActiveId];
  if (!entry) return null;
  return {
    providerId: cachedActiveId,
    apiKey: entry.apiKey,
    model: entry.model,
    baseUrl: entry.baseUrl,
  };
}

/** Carrega o cache descriptografando do localStorage (chamar no boot). */
export async function loadConfigCache(): Promise<void> {
  await ensureCache();
}

/**
 * Salva (ou atualiza) a chave de um provedor NO COFRE.
 * Se não há provedor ativo, este vira o ativo. Não troca o ativo se já existe um.
 */
export async function setConfig(config: AIConfig): Promise<void> {
  await ensureCache();
  if (typeof window === "undefined") return;
  if (!cachedVault) cachedVault = {};
  cachedVault[config.providerId] = {
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
    savedAt: Date.now(),
  };
  if (!cachedActiveId) cachedActiveId = config.providerId;
  await persistVault();
}

/** Define qual provedor está ativo (em uso). */
export async function setActiveProvider(providerId: string): Promise<void> {
  await ensureCache();
  if (cachedVault && cachedVault[providerId]) {
    cachedActiveId = providerId;
    await persistVault();
  }
}

/** Remove a chave de um provedor específico do cofre. */
export async function removeProviderKey(providerId: string): Promise<void> {
  await ensureCache();
  if (!cachedVault) return;
  delete cachedVault[providerId];
  if (cachedActiveId === providerId) {
    // Se removeu o ativo, escolhe o primeiro restante (ou null).
    const remaining = Object.keys(cachedVault);
    cachedActiveId = remaining.length > 0 ? remaining[0] : null;
  }
  await persistVault();
}

/** Remove TODAS as chaves (limpa o cofre). */
export function clearConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(VAULT_KEY);
  window.localStorage.removeItem(LEGACY_KEY);
  cachedVault = null;
  cachedActiveId = null;
}

/** Lista TODAS as chaves cadastradas (mascaradas) — pra exibir na UI. */
export async function listAllProviders(): Promise<
  Array<{ providerId: string; maskedKey: string; model?: string; active: boolean }>
> {
  await ensureCache();
  if (!cachedVault) return [];
  return Object.entries(cachedVault).map(([pid, entry]) => ({
    providerId: pid,
    maskedKey: maskKey(entry.apiKey),
    model: entry.model,
    active: pid === cachedActiveId,
  }));
}

/** Versão síncrona de listAllProviders (usa cache). */
export function listAllProvidersSync(): Array<{
  providerId: string;
  maskedKey: string;
  model?: string;
  active: boolean;
}> {
  if (!cachedVault) return [];
  return Object.entries(cachedVault).map(([pid, entry]) => ({
    providerId: pid,
    maskedKey: maskKey(entry.apiKey),
    model: entry.model,
    active: pid === cachedActiveId,
  }));
}

/** True se há pelo menos uma chave cadastrada (e o ativo é válido). */
export function hasConfig(): boolean {
  return cachedVault != null && cachedVault !== undefined && cachedActiveId != null;
}

/** Marca que precisa recarregar o cache. */
export function invalidateConfigCache(): void {
  cachedVault = undefined;
  cachedActiveId = null;
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

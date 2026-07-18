/**
 * Sistema de assinatura do Moka.
 *
 * Dois planos:
 *   - FREE (BYOK): usuário traz a própria chave de API. Funciona tudo.
 *   - PREMIUM: nós fornecemos a IA (DeepSeek + OpenAI TTS). Sem precisar de chave.
 *
 * Por enquanto, o Premium é simulado (estado local). Quando integrarmos
 * o Stripe / RevenueCat pra cobrança real, substituímos as funções.
 *
 * No futuro (Capacitor / lojas), usaremos RevenueCat pra gerenciar
 * as assinaturas via Google Play Billing e App Store Subscriptions.
 */

const PREMIUM_KEY = "moka.premium";

export type PlanTier = "free" | "premium";

export interface PlanInfo {
  tier: PlanTier;
  /** Data de ativação do premium (timestamp). */
  activatedAt?: number;
  /** Data de expiração (timestamp). Null = vitalício ou ativo. */
  expiresAt?: number | null;
}

/** Lê o plano atual do localStorage. */
export function getPlan(): PlanInfo {
  if (typeof window === "undefined") return { tier: "free" };
  try {
    const raw = window.localStorage.getItem(PREMIUM_KEY);
    if (!raw) return { tier: "free" };
    const parsed = JSON.parse(raw) as PlanInfo;
    // Verifica se não expirou.
    if (parsed.tier === "premium" && parsed.expiresAt && parsed.expiresAt < Date.now()) {
      return { tier: "free" };
    }
    return parsed;
  } catch {
    return { tier: "free" };
  }
}

/** Verifica se o usuário é premium. */
export function isPremium(): boolean {
  return getPlan().tier === "premium";
}

/**
 * Ativa o Premium (simulado — depois integra com Stripe/RevenueCat).
 * Em produção, isso só é chamado após confirmação de pagamento.
 */
export function activatePremium(durationDays?: number): void {
  if (typeof window === "undefined") return;
  const info: PlanInfo = {
    tier: "premium",
    activatedAt: Date.now(),
    expiresAt: durationDays ? Date.now() + durationDays * 86400000 : null,
  };
  window.localStorage.setItem(PREMIUM_KEY, JSON.stringify(info));
}

/** Cancela o Premium (volta pra Free). */
export function deactivatePremium(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PREMIUM_KEY);
}

/**
 * Preços dos planos (placeholder — ajustar quando definir os valores reais).
 * Em USD pra alinhar com Google Play / App Store.
 */
export const PLAN_PRICES = {
  monthly: { price: "$4.99", period: "/mês" },
  quarterly: { price: "$12.99", period: "/trimestre" },
  yearly: { price: "$39.99", period: "/ano" },
};

/**
 * Recursos de cada plano (pra mostrar na página /premium).
 */
export const PLAN_FEATURES = {
  free: [
    "Traga sua própria chave de API (BYOK)",
    "8 provedores de IA (DeepSeek, OpenAI, Kimi, etc)",
    "Tradução e explicação ilimitadas",
    "Leitura em voz alta (voz do dispositivo)",
    "12 idiomas de interface",
    "Múltiplas chaves salvas",
  ],
  premium: [
    "Tudo do plano Free",
    "IA inclusa — sem precisar de chave",
    "Voz neural natural (OpenAI TTS)",
    "DeepSeek V3 ilimitado",
    "☁️ Biblioteca na nuvem — seus livros em qualquer dispositivo",
    "EPUB: sincroniza completo (sem limite)",
    "PDF: até 50 MB cada",
    "Sem anúncios, sem limites",
    "Suporte prioritário",
  ],
};

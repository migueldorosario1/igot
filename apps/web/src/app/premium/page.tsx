"use client";

import { useState } from "react";
import { PLAN_PRICES, PLAN_FEATURES, isPremium, activatePremium, deactivatePremium } from "@/lib/subscription";
import { useI18n } from "@/components/I18nProvider";

/**
 * Página /premium — vitrine de assinatura do Moka Premium.
 *
 * Mostra os 2 planos (Free vs Premium), os recursos de cada um,
 * e o botão de assinar. Por enquanto a ativação é simulada (localStorage).
 * Quando integrarmos Stripe/RevenueCat, o botão dispara o fluxo de pagamento.
 */
export default function PremiumPage() {
  const { t } = useI18n();
  const [premium, setPremium] = useState(isPremium());
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  const handleSubscribe = () => {
    // SIMULAÇÃO — depois conecta com Stripe/RevenueCat.
    // Por enquanto, ativa direto pra teste.
    const days = selectedPlan === "monthly" ? 30 : selectedPlan === "quarterly" ? 90 : 365;
    activatePremium(days);
    setPremium(true);
  };

  const handleCancel = () => {
    deactivatePremium();
    setPremium(false);
  };

  return (
    <main className="premium-page">
      <div className="premium-card">
        <a href="/" className="premium-back">← Moka</a>

        <div className="premium-header">
          <span className="premium-logo">☕</span>
          <h1>Moka Premium</h1>
          <p className="premium-subtitle">
            A melhor experiência de leitura com IA. Sem chaves, sem configuração.
          </p>
        </div>

        {premium ? (
          /* ESTADO: já é premium */
          <div className="premium-active">
            <div className="premium-badge">✨ Você é Premium</div>
            <p>Aproveite todos os recursos inclusos. Obrigado por apoiar o Moka!</p>
            <button className="btn-cancel" onClick={handleCancel}>
              Cancelar assinatura
            </button>
          </div>
        ) : (
          /* ESTADO: ainda não é premium */
          <>
            {/* Comparação de planos */}
            <div className="plans-comparison">
              {/* FREE */}
              <div className="plan-card plan-free">
                <h2>Free</h2>
                <p className="plan-price">Grátis</p>
                <p className="plan-desc">Traga sua própria chave de IA</p>
                <ul className="plan-features">
                  {PLAN_FEATURES.free.map((f, i) => (
                    <li key={i}>✓ {f}</li>
                  ))}
                </ul>
              </div>

              {/* PREMIUM */}
              <div className="plan-card plan-premium">
                <div className="plan-badge">⭐ Recomendado</div>
                <h2>Premium</h2>
                <p className="plan-price">{PLAN_PRICES[selectedPlan].price}</p>
                <p className="plan-period">{PLAN_PRICES[selectedPlan].period}</p>
                <p className="plan-desc">IA inclusa, sem configuração</p>
                <ul className="plan-features">
                  {PLAN_FEATURES.premium.map((f, i) => (
                    <li key={i}>✓ {f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Seletor de período */}
            <div className="period-selector">
              {(["monthly", "quarterly", "yearly"] as const).map((p) => (
                <button
                  key={p}
                  className={`period-btn ${selectedPlan === p ? "active" : ""}`}
                  onClick={() => setSelectedPlan(p)}
                >
                  <span className="period-label">
                    {p === "monthly" ? "Mensal" : p === "quarterly" ? "Trimestral" : "Anual"}
                  </span>
                  <span className="period-price">{PLAN_PRICES[p].price}</span>
                  {p === "yearly" && <span className="period-save">Economize 33%</span>}
                </button>
              ))}
            </div>

            {/* Botão de assinar */}
            <button className="btn-subscribe" onClick={handleSubscribe}>
              Assinar Moka Premium
            </button>
            <p className="subscribe-note">
              Cancele quando quiser. Pagamento processado pelo Google Play / App Store.
            </p>
          </>
        )}

        {/* FAQ */}
        <div className="premium-faq">
          <h3>Perguntas frequentes</h3>
          <details>
            <summary>Preciso de uma chave de API no Premium?</summary>
            <p>Não! No Premium, a IA é inclusa. Você não precisa configurar nada — só assinar e usar.</p>
          </details>
          <details>
            <summary>Posso continuar usando o plano Free?</summary>
            <p>Sim! O plano Free é gratuito para sempre. Você só precisa cadastrar sua própria chave de API de qualquer provedor.</p>
          </details>
          <details>
            <summary>Qual IA o Premium usa?</summary>
            <p>Usamos DeepSeek (modelo V3) para tradução e explicação, e OpenAI para voz neural natural. Sempre atualizamos para os melhores modelos disponíveis.</p>
          </details>
          <details>
            <summary>Posso cancelar quando quiser?</summary>
            <p>Sim. Cancele a qualquer momento. Você continua com acesso até o fim do período pago.</p>
          </details>
        </div>

        {/* Rodapé */}
        <div className="premium-footer">
          <p>
            <strong>Moka</strong> — Leia qualquer coisa. Entenda tudo.<br />
            Um produto do Cafezinho Media Group — Niterói, RJ — Brasil
          </p>
        </div>
      </div>

      <style>{`
        .premium-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 40px 20px;
        }
        .premium-card {
          max-width: 720px;
          margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 40px;
          box-shadow: var(--shadow);
        }
        .premium-back {
          color: var(--accent);
          text-decoration: none;
          font-size: 14px;
        }
        .premium-header {
          text-align: center;
          margin: 24px 0 40px;
        }
        .premium-logo {
          font-size: 48px;
          display: block;
          margin-bottom: 8px;
        }
        .premium-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: var(--accent);
          margin: 0 0 8px;
        }
        .premium-subtitle {
          font-size: 16px;
          color: var(--text-muted);
          margin: 0;
        }
        .plans-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }
        .plan-card {
          border: 2px solid var(--border);
          border-radius: 14px;
          padding: 24px;
          position: relative;
        }
        .plan-premium {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent);
          color: white;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .plan-card h2 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .plan-price {
          font-size: 32px;
          font-weight: 700;
          color: var(--accent);
          margin: 8px 0 0;
        }
        .plan-period {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0 0 12px;
        }
        .plan-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0 0 16px;
        }
        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .plan-features li {
          font-size: 14px;
          line-height: 1.5;
          color: var(--text);
        }
        .period-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }
        .period-btn {
          flex: 1;
          padding: 12px;
          border: 2px solid var(--border);
          background: var(--surface);
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          transition: all 150ms ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .period-btn.active {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .period-label {
          font-size: 13px;
          font-weight: 600;
        }
        .period-price {
          font-size: 16px;
          font-weight: 700;
          color: var(--accent);
        }
        .period-save {
          font-size: 11px;
          color: #6b8e3d;
          font-weight: 600;
        }
        .btn-subscribe {
          width: 100%;
          padding: 16px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .btn-subscribe:hover {
          background: var(--accent-dark);
          transform: scale(1.02);
        }
        .subscribe-note {
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
          margin: 12px 0 32px;
        }
        .premium-active {
          text-align: center;
          padding: 40px 20px;
        }
        .premium-badge {
          display: inline-block;
          background: var(--accent);
          color: white;
          padding: 8px 24px;
          border-radius: 24px;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .premium-active p {
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        .btn-cancel {
          padding: 10px 20px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .premium-faq {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        .premium-faq h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 16px;
        }
        .premium-faq details {
          margin-bottom: 12px;
        }
        .premium-faq summary {
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          padding: 8px 0;
        }
        .premium-faq details[open] summary {
          color: var(--accent);
        }
        .premium-faq p {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.6;
          margin: 8px 0 0;
          padding-left: 8px;
        }
        .premium-footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.6;
        }
        @media (max-width: 600px) {
          .plans-comparison {
            grid-template-columns: 1fr;
          }
          .period-selector {
            flex-direction: column;
          }
          .premium-card {
            padding: 24px 20px;
          }
        }
      `}</style>
    </main>
  );
}

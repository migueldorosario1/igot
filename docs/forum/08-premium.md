# 💰 Fórum 08 — Premium (Modelo de Negócio)

> Free (BYOK) → Plus (IA embutida) → Pro (RAG) → Lifetime.
> Detalhes em [STRATEGY.md](../STRATEGY.md).

---

## Tiers

| Tier | Preço | O que include | Quem paga a IA |
|------|-------|---------------|----------------|
| **Free** | $0 | Leitor + BYOK (você traz a chave) | O usuário |
| **Plus** | ~$69-89/ano | IA embutida (sem chave), tradução ilimitada (fair-use) | Nós (~$0,04-0,50/usuário/mês) |
| **Pro** | ~$149-179/ano | + traduz livro inteiro + super-memória (RAG) + leitura ilimitada | Nós (~$1-3/usuário/mês) |
| **Lifetime** | ~$199-399 | Acesso vitalício (upsell) | — |

## Por que Free = BYOK é genial
- Custo de inferência do usuário free = **zero** pra nós
- Free vira funil de aquisição (não ralo de custo)
- Premium vende **conveniência** (não lidar com chaves) + **capacidade** (RAG)

## Margem
- **Plus**: 90%+ (custo de IA ~$0,04-0,50/mês, preço $7-8/mês)
- **Pro**: 80%+ (custo ~$1-3/mês com RAG, preço $12-15/mês)

## Modelo
**Assinatura** combina melhor que compra única porque:
- Custo de IA é recorrente
- Churn de apps de leitura é baixo
- Stores facilitam cobrança recorrente

## Pendente
- [ ] Implementar Stripe / RevenueCat / Google Play Billing
- [ ] UI de tiers (telas de upgrade)
- [ ] Provisionamento de IA embutida (chave nossa no servidor quando premium)

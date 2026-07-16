# 📱 Fórum 05 — Lojas (Google Play + App Store)

> Resumo de como publicar nas lojas sem domínio próprio e (no iOS) sem Mac.
> Detalhes completos em [STRATEGY.md](../STRATEGY.md).

---

## Google Play (Android)

| Item | Detalhe |
|------|---------|
| **Custo** | US$ 25 (único na vida) — cartão Visa/MC internacional |
| **Embrulho** | Capacitor 8 (melhor que TWA pra acesso a arquivos) |
| **Build** | Linux (Android Studio 2025.2.1) |
| **Pacote** | `.aab` targetSdk=35 (migrar p/ 36 antes de 31/08/2026) |
| **Timeline** | 3-4 semanas (conta pessoal nova: 12 testers por 14 dias) |
| **Política IA** | Declarar uso + botão de report nas respostas |

### Requisitos obrigatórios
- [ ] Política de Privacidade (URL HTTPS pública)
- [ ] Data Safety form preenchido
- [ ] 4-8 screenshots por dispositivo
- [ ] Ícone 512×512 + feature graphic 1024×500
- [ ] Credenciais de login de teste
- [ ] Botão de exclusão de conta
- [ ] Declaração de IA generativa + botão de report

---

## App Store (iOS)

| Item | Detalhe |
|------|---------|
| **Custo** | US$ 99/ano (recorrente) |
| **Mac obrigatório?** | **NÃO** — GitHub Actions (200 min grátis/mês) ou Codemagic (500 min grátis) |
| **Custo total iOS** | ~US$ 99-150/ano |
| **Revisão** | 90% em <24h; apps novos: 2-5 dias |
| **Risco** | Guideline 4.2 (Minimum Functionality) — app Capacitor precisa ter valor além de "web wrapper" |

### Fluxo sem Mac
1. Criar App ID + certificados no portal Apple (pelo navegador)
2. Gerar App Store Connect API Key
3. Guardar certificados como GitHub Secrets
4. Workflow `runs-on: macos-latest` → compila → publica
5. **Ou**: Mac emprestado de uma tarde pro setup inicial

---

## Links de referência
- [Capacitor docs](https://capacitorjs.com/docs/android)
- [Google Play Console](https://play.google.com/console)
- [Apple Developer](https://developer.apple.com/programs/)
- [GitHub Actions macOS pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing)
- [Codemagic pricing](https://codemagic.io/pricing/)

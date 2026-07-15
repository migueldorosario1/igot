# 🧭 Estratégia — igot

> "Fórum" permanente de decisão. Este documento vive no repositório e guía
> as próximas fases do produto. Edite conforme decisões forem tomadas.

**Última revisão**: 15 de julho de 2026
**Dono**: Miguel Dorosario

---

## 🎯 Conceito do produto

> **"Leia qualquer livro em qualquer idioma. A IA traduz e explica — e suas
> chaves nunca saem do seu dispositivo."**

O **igot** ("I got it!") é um leitor de e-books que conhece o livro inteiro e
ajuda a destravar a leitura em qualquer língua, sobre qualquer assunto.
Diferencial: **traga seu próprio arquivo** (PDF/EPUB), **IA agnóstica**
(BYOK ou embutida), **local-first** (privacidade real).

### Tiers planejados

| Tier | Preço | O que inclui |
|------|-------|--------------|
| **Free** | $0 | Leitor PDF/EPUB + seleção → Traduzir/Explicar com **BYOK** (você traz a chave de IA) |
| **Plus** | ~$69–89/ano | **IA embutida** — sem precisar de chave própria. Tradução/explicação ilimitada (fair-use) |
| **Pro (Super Premium)** | ~$149–179/ano | Tudo do Plus + **traduz livro inteiro** + **super-memória (RAG)** + leitura ilimitada |
| **Lifetime** (upsell) | ~$199–399 | Acesso vitalício — converte quem odeia assinatura, injeta caixa no lançamento |

**Por que Free = BYOK é genial**: o custo de inferência do usuário free é
**zero** pra você (ele paga a própria API). O Free vira funil puro de
aquisição. O premium vende **conveniência** (não lidar com chaves) e
**capacidade** (RAG, livro inteiro).

### Custo de IA por usuário ativo (2026)
- Tradução/explicação com **DeepSeek/Qwen Flash**: ~$0,002/sessão → **~$0,04/mês**
- Mesmo com **GLM flagship**: ~$0,20–0,50/mês
- RAG (super-memória): ~$1–3/mês
- **Margem do Plus/Pro: 90%+**.

---

## 📱 Google Play (Android) — caminho de menor custo

| Item | Detalhe |
|------|---------|
| **Conta dev Google** | US$ 25 (único na vida) — cartão Visa/MC internacional |
| **Embrulho** | **Capacitor 8** (melhor que TWA pra acesso a arquivos locais) |
| **Build** | Linux funciona perfeitamente — Android Studio 2025.2.1 (~1,5 GB) |
| **Pacote** | `.aab` com `targetSdk=35` (migrar p/ 36 antes de 31/08/2026) |
| **Timeline** | Conta pessoal nova: ~3-4 semanas (14 dias de teste fechado c/ 12 testers obrigatório) |
| **Política de IA** | Declarar uso de IA generativa + botão de report nas respostas |

**Atenção**: conta pessoal nova exige **12 testadores por 14 dias** antes
de publicar em produção. Conta de organização (com D-U-N-S) pula isso.

### Requisitos obrigatórios
- [ ] Política de Privacidade hospedada em URL HTTPS
- [ ] Formulário Data Safety preenchido
- [ ] 4-8 screenshots por tipo de dispositivo
- [ ] Ícone 512×512 + feature graphic 1024×500
- [ ] Credenciais de login de teste (se houver login)
- [ ] Botão de exclusão de conta (política 2023+)
- [ ] Declaração de IA generativa + botão de report

---

## 🍎 App Store (iOS) — sem comprar Mac

| Item | Detalhe |
|------|---------|
| **Conta Apple Developer** | US$ 99/ano (recorrente) |
| **Mac obrigatório?** | **NÃO** — dá pra publicar 100% do Linux |
| **Build na nuvem** | **GitHub Actions** (runner macOS: ~200 min grátis/mês) ou **Codemagic** (500 min grátis/mês) |
| **Custo total iOS** | ~US$ 99–150/ano (Apple + runner) |
| **Revisão** | 90% dos apps em <24h; apps novos: 2-5 dias |
| **Risco** | Guideline 4.2 (Minimum Functionality) — app Capacitor precisa ter valor além de "web wrapper" |

### Fluxo sem Mac
1. Criar App ID + certificados no portal Apple (pelo navegador, Linux)
2. Gerar App Store Connect API Key (download `.p8`)
3. Guardar certificados como GitHub Secrets
4. Workflow `runs-on: macos-latest` → `cap sync` + `fastlane` → publica
5. **Alternativamente**: Mac emprestado de uma tarde pro setup inicial

---

## 🔐 Segurança e comunicação pro usuário

### O que podemos afirmar (com verdade técnica)

| Mensagem | Por quê é verdade |
|----------|-------------------|
| **"Suas chaves de IA nunca saem do seu dispositivo"** | BYOK: localStorage, nunca persistida no servidor |
| **"Login Google: só e-mail + foto"** | OAuth scope padrão (`openid email profile`) — sem Gmail, contatos, etc |
| **"Cada usuário tem um cofre privado"** | Supabase RLS: `WHERE user_id = auth.uid()` no banco |
| **"Seus arquivos nunca passam pelos nossos servidores"** | Local-first: PDF/EPUB processados no navegador |

### Conformidade legal

- **LGPD/GDPR**: app coleta mínimo (email/foto via Google). Chaves e arquivos
  ficam no device → escopo reduzido. Precisa: Política de Privacidade +
  fluxo de exclusão de conta.
- **DMCA Safe Harbor**: usuário traz o próprio arquivo → §512(c). Registrar
  DMCA agent ($6) + implementar notice-and-takedown.
- **Gerar documentos**: [iubenda](https://www.iubenda.com) (cobre LGPD+GDPR)
  ou [TermsFeed](https://www.termsfeed.com) — grátis.

---

## 📣 Divulgação (orçamento mínimo ~$500–$1.000 + 20-30h/sem de founder)

### Foco prioritário

| Canal | Por quê |
|-------|---------|
| **Reddit** (conversão) | r/languagelearning, r/LearnJapanese, r/German, r/Spanish, r/translator, r/scholar. Público segmentado, alta intenção |
| **TikTok** (alcance) | #BookTok + #LanguageLearning — nichos gigantes, alcance viral orgânico real |
| **Product Hunt** (launch) | Público early-adooster que valoriza BYOK/privacidade. Lançar num **sábado 00:01 PST** |
| **YouTube** (longo prazo) | "Como ler livros em [idioma]" ranqueia por anos |

### Regra de ouro do Reddit
90% participação genuína, 10% menção ao app. Violar = banimento.

### ASO (ranquear nas lojas sem anúncio)
- **Título** (30 chars): "igot: Leitor PDF EPUB com IA"
- **Keywords de cauda longa**: "translate EPUB AI", "read PDF foreign language"
- **Localização**: traduzir título/descrição/screenshots em 6+ idiomas
- **A/B de ícone grátis** (Google Play tem nativo)

---

## 🆚 Concorrentes — onde o igot se diferencia

| App | Faz tradução multi-idioma + IA explicativa? | Aceita PDF/EPUB do usuário? | Preço |
|-----|---------------------------------------------|----------------------------|-------|
| Speechify | ❌ (só TTS/áudio) | ✅ | $139/ano |
| Headway | ❌ (catálogo fechado) | ❌ | $90/ano |
| Blinkist | ❌ (catálogo fechado) | ❌ | $100–175/ano |
| Google Play Books | ❌ (não traduz) | ✅ | Grátis |
| Apple Books | ❌ | ✅ | Grátis |
| **igot** | **✅ (único)** | **✅** | Free → $179/ano |

**Mercado sem dono**: falantes de PT/ES lendo inglês/japonês/alemão;
estudantes de pós lendo papers; polyglots; tradutores.

---

## 🗺️ Próximos passos (priorizados)

1. **Destravar login Google** (configurar Site URL no Supabase) ← pendente
2. **Política de Privacidade + Termos** (iubenda, hospedar na Vercel)
3. **Botão de report** nas respostas da IA (política do Google Play)
4. **Fluxo de exclusão de conta** (política 2023+)
5. **Capacitor + Google Play** (Android primeiro — menor custo/complexidade)
6. **Product Hunt launch** (quando o app estiver polido)
7. **iOS via GitHub Actions** (depois do Android validado)

---

_Fonte das pesquisas: developer.android.com, developer.apple.com,
capacitorjs.com, docs.github.com, codemagic.io, supabase.com,
apptweak.com, businessofapps.com, iubenda.com._

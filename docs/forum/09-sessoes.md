# 🗓️ Fórum 09 — Sessões (Registro de Conversas)

> Registro cronológico das sessões importantes de desenvolvimento.
> Para retomar contexto numa nova conversa, use [JORNADA.md](../JORNADA.md).

---

## Sessões

### 13-15 de julho de 2026 — Sessão fundadora
- **Duração**: ~3 dias de trabalho
- **O que aconteceu**: do conceito ("Readera com cérebro") ao app deployado
  com login Google, 7 provedores de IA, streaming, persistência, PWA
- **Arquivo de handoff**: [JORNADA.md](../JORNADA.md)
- **Fórum da sessão**: [igot-forum-2026-07-15_20h02.md](./igot-forum-2026-07-15_20h02.md)
- **Decisões principais**:
  - Nome: igot ("I got it!")
  - Stack: Next.js + TypeScript monorepo
  - Multi-provedor BYOK (não prender a uma IA)
  - Persistência híbrida (IndexedDB local + Supabase nuvem)
  - Login Google via Supabase
  - Domínio próprio: adiado (não é prioridade)
  - Lojas: Capacitor (Android primeiro, iOS depois sem Mac)
  - Premium: Free (BYOK) → Plus → Pro (RAG) → Lifetime

### 16 de julho de 2026 — Estante, rotas e estabilização
- **Duração**: 1 dia
- **O que aconteceu**: estante de múltiplos livros (grid de capas), rotas com
  URL própria (`/book/[id]`), redesign visual (onboarding, tipografia, progresso),
  correções de bugs críticos (scroll, zoom, quadrado preto, migração), barra de
  navegação rápida (slider)
- **Fórum da sessão**: [igot-forum-2026-07-16_19h53.md](./igot-forum-2026-07-16_19h53.md)
- **Decisões principais**:
  - Home vira estante (grid de capas, como Kindle/Apple Books)
  - Cada livro tem URL própria (`/book/[id]`)
  - Migração automática de livros antigos (store `sessions` → `books`)
  - Touch-action: auto (pan-y bloqueava scroll vertical)
  - Medição estável no PdfPageCanvas (avô do container, não o pai)

---

## Como adicionar uma nova sessão
1. Crie um arquivo `igot-forum-AAAA-MM-DD_HHhMM.md` neste diretório
2. Adicione uma entrada aqui com data + resumo + link
3. Atualize JORNADA.md se marcos importantes foram atingidos

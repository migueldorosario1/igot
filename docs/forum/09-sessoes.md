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

---

## Como adicionar uma nova sessão
1. Crie um arquivo `igot-forum-AAAA-MM-DD_HHhMM.md` neste diretório
2. Adicione uma entrada aqui com data + resumo + link
3. Atualize JORNADA.md se marcos importantes foram atingidos

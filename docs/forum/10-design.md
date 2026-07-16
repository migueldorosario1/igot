# 🎨 Fórum 10 — Design & Visual

> O app funciona, mas precisa parecer um **produto profissional**, não um
> protótipo técnico. Este fórum rastreia as melhorias de visual.

---

## 🔍 Problemas identificados (priorizar)

### 1. Seletor de texto instável (BUG)
- **Sintoma**: ao selecionar perto do fim da página, a página "corre"/rola sozinha
- **Causa**: rolagem automática do container durante seleção por toque
- **Fix**: `overscroll-behavior: contain` + `touch-action` + travar scroll durante seleção ativa
- **Complexidade**: Baixa (1 hora)

### 2. Visual geral sem polimento
- Cores e tipografia funcionam mas não encantam
- Faltam micro-interações (transições, hover states, feedback visual)
- Header está funcional mas sem "personalidade"
- Layout do painel da IA é espartano
- **Complexidade**: Média (4-8 horas)

### 3. Primeira impressão (onboarding)
- Tela inicial (Uploader) é só uma dropzone — sem explicar o que é o app
- Faltam: tagline visual, mini-tutorial, indicação de "configure sua IA primeiro"
- **Complexidade**: Média (3-4 horas)

### 4. Tipografia do leitor (EPUB)
- Hoje usa fontes do sistema (sans-serif genérica)
- Deveria oferecer tipografia de leitura (serifada, tamanhos, temas)
- **Complexidade**: Média (2-3 horas)

### 5. Capa/visualização do livro
- Não mostra a capa do livro atual em nenhum lugar
- Faltam metadados visuais (título, autor, capa) no header do Reader
- **Complexidade**: Baixa (1-2 horas)

---

## 🎯 O que fazer (priorizado)

| # | Melhoria | Impacto | Esforço |
|---|----------|---------|---------|
| 1 | **Fix do seletor** (scroll bug) | Alto (UX crítico) | 1h |
| 2 | **Onboarding** (tela inicial bonita) | Alto (primeira impressão) | 3-4h |
| 3 | **Header do Reader** (capa + título + progresso) | Médio | 2h |
| 4 | **Tipografia** (serifada, temas claro/escuro/sephia) | Médio | 2-3h |
| 5 | **Micro-interações** (transições, feedback) | Médio | 3-4h |
| 6 | **Painel da IA** (mais polido, melhor hierarquia) | Médio | 2-3h |

---

## 🎨 Direção de design

### Princípios
- **Sensação de livro**: papel creme, serifada, margens generosas (como Apple Books)
- **Calma**: sem distrações, foco no texto
- **Confiança**: visual limpo e profissional (não amador)
- **IA discreta**: presente quando precisa, não intrusiva

### Referências
- Apple Books (layout de leitura, tipografia)
- Kindle (simplicidade do header)
- Readwise Reader (destaques e anotações)
- Notion (clareza e whitespace)

### Paleta atual (cores CSS)
- `--bg`: fundo (creme claro / escuro)
- `--accent`: terracota (#c8553d) — cor da marca 💡
- Funciona, mas pode refinar tons e contraste

---

## 📊 Complexidade total
**Média-alta** (15-25 horas pra um redesign completo)
Mas pode fazer incremental: 2-3h por melhoria, priorizando as de maior impacto.

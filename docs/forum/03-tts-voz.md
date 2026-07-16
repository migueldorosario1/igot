# 🔊 Fórum 03 — TTS (Leitura em Voz Alta)

> O app lê em voz alta: a tradução, a explicação, a página inteira (original
> ou traduzida). Botão de "▶ Ouvir" em cada contexto.

---

## 🎯 Objetivo

### Onde tem botão "▶ Ouvir"
1. **Painel da IA** — ao lado de cada resposta (tradução/explicação)
2. **Página traduzida** (overlay) — lê a tradução inteira em voz alta
3. **Página original do livro** — lê o texto original (inglês, português, etc.)
4. **Anotações salvas** — lê a anotação em voz alta

### Idioma da voz
- Detecta automaticamente o idioma do texto que tá lendo
- Se for tradução em português → voz em português
- Se for original em inglês → voz em inglês
- Usuário pode escolher a voz no settings (se múltiplas disponíveis)

---

## 🏗️ Como implementar

### Opção A: Web Speech API (`speechSynthesis`) — GRÁTIS
- `window.speechSynthesis` — nativa do navegador, **zero custo**
- Suporte no iOS Safari: **bom** (a partir do iOS 7)
- Vozes disponíveis dependem do sistema operacional (iPad tem vozes em vários idiomas)
- **Pró**: grátis, offline, sem API key, sem latência
- **Contra**: qualidade varia por dispositivo, entonação robótica em algumas vozes

### Opção B: TTS da IA (OpenAI TTS, ElevenLabs, GLM TTS)
- Manda o texto pra API → recebe áudio MP3 → toca
- **Pró**: qualidade premium (vozes naturais, multilíngue perfeito)
- **Contra**: custo por caractere/minuto, latência, precisa de chave

**Recomendação**: começar com **Opção A (Web Speech API)** — é grátis e imediato.
No futuro (tier Premium), oferecer TTS da IA como diferencial premium.

### UI do player de áudio
- Botão **▶ Ouvir** (▶ quando parado, ⏸ quando tocando)
- Controles: **⏮ ⏸ ⏭** (próximo/anterior parágrafo)
- Destacar o parágrafo que tá sendo lido (estilo karaoke)
- Velocidade ajustável (0.75x, 1x, 1.25x, 1.5x, 2x)

---

## 📊 Complexidade
- **Web Speech API básica** (botão ▶): Baixa (2-3 horas)
- **Player completo** (parágrafos, velocidade, destaque): Média (4-6 horas)
- **TTS da IA (premium)**: Alta (8+ horas + custo de API)

## 🔗 Relacionado
- Independente (pode implementar isoladamente)
- Complementa a tradução de página (ouvir a tradução enquanto lê)

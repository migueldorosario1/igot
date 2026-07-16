# 💬 Fórum 02 — Comentários (Texto e Áudio)

> O usuário pode fazer anotações livres sobre o livro: por texto ou por
> áudio (que o app transcreve automaticamente).

---

## 🎯 Objetivo

### Comentários por texto
- Espaço livre onde o usuário escreve o que quiser sobre o livro/trecho
- Pode estar associado a um trecho selecionado (com destaque) ou ser geral
- Fica salvo junto com o livro (persistência IndexedDB/Supabase)

### Comentários por áudio 🎤
- Botão "🎤 Gravar" → abre o microfone
- Usuário fala sua anotação
- O app **transcreve** o áudio pra texto (speech-to-text)
- O texto fica salvo como anotação (igual ao comentário por texto)
- Opcional: guardar também o áudio original (pra re-ouvir)

---

## 🏗️ Como implementar

### Comentários por texto
- Estender o `SavedNote` com um novo tipo: `kind: "comment"` (além de translate/explain/ask)
- Adicionar um campo `comment?: string` livre
- UI: botão "💬 Comentar" no menu de seleção + no painel da IA
- Salva no mesmo lugar das notas (IndexedDB/Supabase)

### Comentários por áudio
**Opção A: Web Speech API (grátis, nativa do navegador)**
- `webkitSpeechRecognition` / `SpeechRecognition` — nativa do Chrome/Safari
- **Pró**: zero custo, zero infraestrutura
- **Contra**: qualidade varia, precisa de internet, não funciona em todos os navegadores
- **No iPad (Safari)**: funciona bem a partir do iOS 14.5+

**Opção B: Gravar áudio + transcrever via IA (OpenAI Whisper, etc.)**
- `MediaRecorder` API grava o áudio
- Manda o áudio pra API de speech-to-text (Whisper da OpenAI, ou similar do DeepSeek/GLM)
- **Pró**: qualidade alta, funciona offline pra gravação
- **Contra**: custo por minuto de áudio, latência, precisa de chave de IA

**Recomendação**: começar com **Opção A (Web Speech API)** — é grátis e nativa.
Se a qualidade não for boa o suficiente, migrar pra Opção B depois.

---

## 📊 Complexidade
- **Comentários por texto**: Baixa (1-2 horas)
- **Comentários por áudio (Web Speech API)**: Média (3-4 horas)
- **Comentários por áudio (Whisper/IA)**: Alta (6-8 horas + custo de API)

## 🔗 Relacionado
- Depende do sistema de notas (já implementado)
- Depende da estante (pra associar comentários ao livro certo)

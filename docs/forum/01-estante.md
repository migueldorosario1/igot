# 📚 Fórum 01 — Estante (Biblioteca do Usuário)

> Cada livro que o usuário abre vai pra uma estante visual. Ele pode voltar
> a qualquer livro clicando na capa. A estante é o "diretório" do usuário.

---

## 🎯 Objetivo

- Quando o usuário abre um livro (PDF/EPUB), ele é **automaticamente adicionado à estante**
- A estante aparece como um **botão/link visível** ("Minha estante") no header
- Ao clicar, abre uma **galeria visual** (capas dos livros em grid)
- Clicar num livro → abre direto na **última página lida** (graças à persistência)
- **Logado (Supabase)**: estante sincroniza entre dispositivos
- **Deslogado (IndexedDB)**: estante fica local

---

## 🏗️ Como implementar

### Mudança no modelo de dados
Hoje guardamos só **1 livro** (chave `"current"` no IndexedDB). Pra estante,
precisamos de **múltiplos livros**:

```ts
// IndexedDB: store "books" (key = bookId único)
// Supabase: tabela "books" já suporta múltiplos (só mudamos a query)
interface BookEntry {
  id: string;              // uuid
  title: string;
  author?: string;
  sourceFormat: "epub" | "pdf";
  coverImage?: string;     // data URL da capa (pra mostrar na estante)
  chapterIdx: number;      // última página lida
  zoom: number;
  translations: Record<string, string>;
  notes: SavedNote[];
  savedAt: number;
  createdAt: number;
}
```

### UI
- **Botão "📖 Estante"** no header (ao lado de 📓 Notas)
- Clica → abre um **modal/overlay** com grid de capas
- Cada capa mostra: título, autor, barra de progresso (página X de Y)
- Clica na capa → abre o livro na última página
- Botão 🗑 em cada capa pra remover da estante

### Extração de capa
- **EPUB**: já extraímos imagens do ZIP (data URLs) — pegar a primeira imagem ou a marcada como `cover-image` no OPF
- **PDF**: renderizar a página 1 num canvas pequeno (thumbnail) e guardar como data URL

---

## 📊 Complexidade
**Média** (3-5 horas de trabalho)
- Mudar o `useSession` pra gerenciar múltiplos livros
- UI da estante (grid de capas)
- Extração de thumbnail da capa

## 🔗 Relacionado
- Depende da persistência (IndexedDB/Supabase) — já implementada
- Tabela `books` do Supabase já suporta múltiplos (RLS por `user_id`)

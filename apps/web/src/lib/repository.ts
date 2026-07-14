/**
 * Repository adapter — decide entre NUVEM (Supabase) e LOCAL (IndexedDB).
 *
 * Contrato: quem chama (o hook useSession) não sabe nem liga pra onde os
 * dados vão. Se o usuário tá logado (userId presente), grava/lê no Supabase.
 * Se deslogado, cai no IndexedDB local (fallback que sempre funciona).
 *
 * O pdfSource (Uint8Array do PDF bruto) NUNCA vai pra nuvem — é grande e
 * o usuário reabre o arquivo em outro dispositivo. Sincronizamos só o
 * `book` (ParsedBook — texto estruturado) + progresso + traduções + notas.
 */

import type { ParsedBook } from "@igot/parser";
import { saveSession, loadSession, clearSession, type Session, type SavedNote } from "./db";
import { createClient } from "./supabase/client";

/** O que vai pra nuvem (tudo exceto pdfSource binário). */
export interface CloudBook {
  id: string;
  title: string;
  file_name: string;
  file_size: number;
  source_format: string;
  book: ParsedBook;
  chapter_idx: number;
  zoom: number;
  translations: Record<string, string>;
  notes: SavedNote[];
  saved_at: number;
}

/** Converte a Session local (IndexedDB) pro modelo de nuvem (sem pdfSource). */
export function sessionToCloud(session: Session, cloudId?: string): CloudBook {
  return {
    id: cloudId ?? `book-${Date.now()}`,
    title: session.book.title,
    file_name: session.fileName,
    file_size: session.fileSize,
    source_format: session.book.sourceFormat,
    book: session.book,
    chapter_idx: session.chapterIdx,
    zoom: session.zoom,
    translations: session.translations ?? {},
    notes: session.notes ?? [],
    saved_at: session.savedAt,
  };
}

/**
 * Salva o livro atual.
 * - Logado → upsert no Supabase (tabela `books`).
 * - Deslogado → IndexedDB (key "current").
 */
export async function saveBook(
  session: Session,
  userId: string | null,
  cloudId?: string,
): Promise<string | undefined> {
  // Sempre grava local também (fallback offline + cache).
  await saveSession(session).catch((err) =>
    console.warn("Falha ao gravar local:", err),
  );

  if (!userId) return undefined; // deslogado: só local

  const supabase = createClient();
  const row = sessionToCloud(session, cloudId);
  const { data, error } = await supabase
    .from("books")
    .upsert(
      {
        ...(cloudId ? { id: cloudId } : {}),
        user_id: userId,
        title: row.title,
        file_name: row.file_name,
        file_size: row.file_size,
        source_format: row.source_format,
        book: row.book,
        chapter_idx: row.chapter_idx,
        zoom: row.zoom,
        translations: row.translations,
        notes: row.notes,
        saved_at: row.saved_at,
      },
      { onConflict: cloudId ? "id" : undefined },
    )
    .select("id")
    .single();

  if (error) {
    console.warn("Falha ao gravar na nuvem:", error.message);
    return cloudId;
  }
  return data?.id;
}

/**
 * Carrega o último livro do usuário.
 * - Logado → busca o mais recente da nuvem.
 * - Deslogado → IndexedDB.
 */
export async function loadBook(
  userId: string | null,
): Promise<{ session: Session; cloudId?: string } | null> {
  if (!userId) {
    const local = await loadSession();
    return local ? { session: local } : null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("saved_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Nuvem vazia ou erro → cai pro local.
    const local = await loadSession();
    return local ? { session: local } : null;
  }

  // Reconstrói a Session a partir do row da nuvem (sem pdfSource —
  // o usuário reabre o arquivo se quiser renderizar o PDF nativo).
  const session: Session = {
    id: "current",
    fileName: data.file_name,
    fileSize: data.file_size,
    book: data.book as ParsedBook,
    pdfSource: null,
    chapterIdx: data.chapter_idx ?? 0,
    zoom: data.zoom ?? 1,
    savedAt: data.saved_at ?? Date.now(),
    translations: data.translations ?? {},
    notes: data.notes ?? [],
  };
  return { session, cloudId: data.id };
}

/** Remove o livro atual (local + nuvem se logado). */
export async function deleteBook(
  userId: string | null,
  cloudId?: string,
): Promise<void> {
  await clearSession().catch((err) => console.warn("Falha ao limpar local:", err));
  if (!userId || !cloudId) return;
  const supabase = createClient();
  await supabase.from("books").delete().eq("id", cloudId);
}

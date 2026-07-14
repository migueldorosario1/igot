/**
 * Camada de persistência com IndexedDB.
 *
 * Guarda a SESSÃO DE LEITURA: o último livro aberto + posição (página/capítulo)
 * + zoom. Assim, ao recarregar/fechar/desligar/navegar, o usuário volta pra
 * onde estava — como um app de leitura de verdade.
 *
 * Hoje guardamos só o ÚLTIMO livro (chave fixa "current"). Uma biblioteca de
 * múltiplos livros fica pra uma fase futura.
 *
 * Sem dependências externas — só a API nativa do navegador.
 */

import type { ParsedBook } from "@igot/parser";

const DB_NAME = "igot";
const DB_VERSION = 1;
const STORE = "sessions";
const SESSION_KEY = "current";

/** Tipo de nota salva (tradução, explicação ou pergunta livre). */
export type NoteKind = "translate" | "explain" | "ask";

/** Uma anotação persistida pelo usuário. */
export interface SavedNote {
  id: string;
  kind: NoteKind;
  /** Trecho selecionado (pra translate/explain) ou pergunta (ask). */
  source: string;
  /** Resposta da IA. */
  result: string;
  /** Capítulo/página de origem (opcional). */
  chapterId?: string;
  savedAt: number;
}

/** Tudo que precisa pra retomar a leitura exatamente de onde parou. */
export interface Session {
  id: typeof SESSION_KEY;
  fileName: string;
  fileSize: number;
  book: ParsedBook;
  /** Buffer do PDF original (só quando sourceFormat === "pdf"). */
  pdfSource: Uint8Array | null;
  chapterIdx: number;
  zoom: number;
  savedAt: number;
  /**
   * Traduções de página já prontas. Chave = String(chapterIdx + 1)
   * (alinha com pageNum do PdfPageCanvas). Evita re-traduzir ao navegar.
   */
  translations?: Record<string, string>;
  /** Anotações salvas pelo usuário (tradução/explicação/pergunta). */
  notes?: SavedNote[];
}

/**
 * Abre (ou cria) o banco. Resolve quando tá pronto pra uso.
 *
 * Importante: em alguns contextos (Safari/iOS modo privado, frames
 * restritos), o `indexedDB.open` pode NUNCA disparar onsuccess/onerror —
 * a Promise ficaria pendente pra sempre e travaria o app. Por isso o
 * timeout de segurança: se não responder em 5s, rejeita.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB não disponível neste navegador."));
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Timeout ao abrir IndexedDB (5s)."));
      }
    }, 5000);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE); // key-path externo; usamos chave fixa
      }
    };
    req.onsuccess = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(req.result);
      }
    };
    req.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(req.error ?? new Error("Erro ao abrir IndexedDB."));
      }
    };
  });
}

/** Grava (ou sobrescreve) a sessão atual. */
export async function saveSession(session: Session): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(session, SESSION_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Erro ao gravar sessão."));
    };
  });
}

/** Lê a última sessão gravada (ou null se não houver). */
export async function loadSession(): Promise<Session | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(SESSION_KEY);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as Session | undefined) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error("Erro ao ler sessão."));
    };
  });
}

/** Limpa a sessão (fecha o livro). */
export async function clearSession(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(SESSION_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Erro ao limpar sessão."));
    };
  });
}

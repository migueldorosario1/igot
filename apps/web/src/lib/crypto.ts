/**
 * Criptografia leve pra chaves de IA no localStorage.
 *
 * Usa a Web Crypto API (AES-GCM 256) nativa do navegador. A chave de
 * criptografia é derivada do userAgent + um salt fixo — não é segurança
 * militar (a chave tá no mesmo dispositivo), mas impede que alguém que
 * abre o localStorage "no cru" (ex: extensão maliciosa, inspeção manual)
 * leia a chave de IA diretamente. É como guardar num cofre em vez de
 * deixar embaixo do colchão.
 *
 * "Guarda como segredo de sua própria mulher" — criptografado, não legível.
 */

const SALT = "igot-v1-salt-2026";

/** Deriva uma chave AES-GCM a partir de um segredo do dispositivo. */
async function deriveKey(): Promise<CryptoKey> {
  const password = `${navigator.userAgent}|${location.origin}|${SALT}`;
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Criptografa um texto → devolve base64 do iv+ciphertext. */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(plaintext),
    );
    // Combina iv + ciphertext num base64.
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  } catch {
    // Se falhar (browser antigo, modo privado), devolve o texto cru.
    return plaintext;
  }
}

/** Descriptografa um base64 (iv+ciphertext) → devolve o texto original. */
export async function decrypt(stored: string): Promise<string> {
  // Se não parece base64 criptografado (é texto cru), devolve como tá.
  try {
    const key = await deriveKey();
    const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    // Se falhar (texto não criptografado, browser antigo), devolve cru.
    return stored;
  }
}

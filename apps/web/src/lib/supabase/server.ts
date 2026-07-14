/**
 * Cliente Supabase para o servidor (route handlers, server components).
 *
 * Usado no callback do Google OAuth: troca o `code` por sessão e seta os
 * cookies de autenticação. Os cookies são HttpOnly (não acessíveis via JS
 * do navegador) — seguro contra XSS.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // O set pode falhar num Server Component (só leitura).
            // Pode ser ignorado se houver middleware pra refresh.
          }
        },
      },
    },
  );
}

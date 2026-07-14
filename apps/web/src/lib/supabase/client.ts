/**
 * Cliente Supabase para o navegador (client-side).
 *
 * Usado pro fluxo de login Google (signInWithOAuth), escuta de mudanças de
 * auth (onAuthStateChange) e queries diretas na tabela `books`.
 *
 * As variáveis NEXT_PUBLIC_* ficam no build do cliente — são chaves PÚBLICAS
 * (anon key do Supabase, que é segura de expor). A segurança real vem do
 * Row Level Security (RLS) do Postgres: cada usuário só vê seus dados.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

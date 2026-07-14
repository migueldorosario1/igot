/**
 * GET /api/auth/callback
 *
 * Recebe o redirect do Google OAuth. O Supabase vem com um `code` na query
 * string; trocamos por uma sessão (setando os cookies HttpOnly) e mandamos
 * o usuário de volta pra home.
 *
 * Esse é o fluxo padrão de PKCE do Supabase com @supabase/ssr.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    // Troca o code por sessão (seta os cookies automaticamente).
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Volta pra home (de onde o usuário tinha clicado em Entrar).
  return NextResponse.redirect(requestUrl.origin);
}

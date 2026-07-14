"use client";

/**
 * Hook useAuth — expõe o estado de login do usuário.
 *
 * status: "loading" | "anon" | "authed"
 *   - loading: ainda verificando a sessão (boot)
 *   - anon: deslogado (usa IndexedDB local)
 *   - authed: logado (sincroniza no Supabase)
 *
 * user: dados do usuário (id, email, avatar) quando logado, null caso contrário.
 *
 * Ações: signInWithGoogle() e signOut().
 */

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

export type AuthStatus = "loading" | "anon" | "authed";

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Se as variáveis de ambiente não tão configuradas, fica anon e segue.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setStatus("anon");
      return;
    }

    const supabase = createClient();

    // Pega a sessão inicial (já tem cookie?).
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setStatus(data.session ? "authed" : "anon");
    });

    // Escuta mudanças (login/logout em outra aba, etc).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session ? "authed" : "anon");
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setStatus("anon");
  }, []);

  return {
    status,
    user,
    /** id do usuário quando logado (pra repassar ao repository). */
    userId: user?.id ?? null,
    signInWithGoogle,
    signOut,
  };
}

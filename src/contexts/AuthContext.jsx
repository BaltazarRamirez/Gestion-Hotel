import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseEnabled);

  const loadSession = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    if (!isSupabaseEnabled || !supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });
    return () => subscription.unsubscribe();
  }, [loadSession]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error("Supabase no configurado");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    isAuthenticated: !isSupabaseEnabled || Boolean(session),
    loading,
    signIn,
    signOut,
    isSupabaseEnabled,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

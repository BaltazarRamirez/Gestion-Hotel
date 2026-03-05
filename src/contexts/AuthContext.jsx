import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { setCurrentHotelId } from "../lib/currentHotel";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseEnabled);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hotelId, setHotelId] = useState(null);

  const loadSession = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) {
      setLoading(false);
      setProfileLoaded(true);
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

  const loadProfile = useCallback(async () => {
    if (!supabase?.auth?.getUser || !session?.user?.id) {
      setProfileLoaded(true);
      return;
    }
    setProfileLoaded(false);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("hotel_id")
        .eq("id", session.user.id)
        .single();
      const h = error ? "hotel-1" : (data?.hotel_id ?? "hotel-1");
      setCurrentHotelId(h);
      setHotelId(h);
    } catch {
      setCurrentHotelId("hotel-1");
      setHotelId("hotel-1");
    } finally {
      setProfileLoaded(true);
    }
  }, [session?.user?.id]);

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

  useEffect(() => {
    if (!session) {
      setProfileLoaded(false);
      setHotelId(null);
      return;
    }
    loadProfile();
  }, [session, loadProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error("Supabase no configurado");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setHotelId(null);
    setProfileLoaded(false);
    setCurrentHotelId("hotel-1");
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    isAuthenticated: !isSupabaseEnabled || Boolean(session),
    loading,
    profileLoaded,
    hotelId,
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

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const forceOffline = String(import.meta.env.VITE_FORCE_OFFLINE ?? "").toLowerCase() === "true";

if (forceOffline) {
  console.warn("VITE_FORCE_OFFLINE=true. Usando datos en memoria.");
} else if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Usá datos en memoria."
  );
}

let supabaseClient = null;

if (!forceOffline && supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error(
      "[supabase] No se pudo inicializar el cliente. Se usará modo memoria.",
      error
    );
  }
}

export const supabase = supabaseClient;

/** Si no hay config de Supabase, los servicios usan datos en memoria */
export const isSupabaseEnabled = Boolean(supabase);

import { createClient } from '@supabase/supabase-js'

// Leggiamo le variabili d'ambiente direttamente da Vite
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

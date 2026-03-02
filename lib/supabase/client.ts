import { createClient } from "@supabase/supabase-js";

// Browser-side Supabase client — uses the anon (public) key.
// This is safe to use in React components and client-side code.
// RLS policies on the database control what this client can access.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client — uses the service_role (secret) key.
// This BYPASSES Row Level Security — use only in API routes and server code.
// NEVER import this file from a client component or any file that runs in the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

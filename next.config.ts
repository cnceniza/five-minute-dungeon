import type { NextConfig } from "next";

// We can add environment variable validation here.
// These variables will be set in Step 1.5.
const requiredEnvs = [
  // "NEXT_PUBLIC_PARTYKIT_HOST",
  // "NEXT_PUBLIC_SUPABASE_URL",
  // "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

for (const env of requiredEnvs) {
  if (!process.env[env]) {
    console.warn(`⚠️ Warning: Environment variable ${env} is not defined. (Expected to be undefined during step 1.2)`);
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { PublicEnv } from "@/lib/env/schema";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(env?: PublicEnv): SupabaseClient {
  if (!browserClient) {
    if (!env) throw new Error("Public Supabase configuration must be provided on first use");
    browserClient = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  }
  return browserClient;
}

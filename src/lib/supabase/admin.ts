import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readServerEnv } from "@/lib/env/schema";

let adminClient: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const env = readServerEnv();
    adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "x-client-info": "research-swarm-worker" } },
    });
  }
  return adminClient;
}

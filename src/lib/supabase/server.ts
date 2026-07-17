import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { readPublicEnv } from "@/lib/env/schema";

export async function createServerSupabaseClient() {
  const env = readPublicEnv();
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; Proxy refreshes them for those requests.
        }
      },
    },
  });
}

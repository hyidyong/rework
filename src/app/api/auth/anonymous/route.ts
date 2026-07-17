import { assertSameOrigin } from "@/lib/http/same-origin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const supabase = await createServerSupabaseClient();
    const { data: current } = await supabase.auth.getUser();
    if (current.user) return Response.json({ userId: current.user.id });
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      return Response.json(
        { error: error?.message ?? "Anonymous sign-in failed" },
        { status: 503 },
      );
    }
    return Response.json({ userId: data.user.id }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 403 },
    );
  }
}

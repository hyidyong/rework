import { readServerEnv } from "@/lib/env/schema";
import { decryptText } from "@/lib/security/envelope";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type FinalPaperRow = {
  id: string;
  owner_id: string;
  proposal_id: string;
  version: number;
  title: string;
  body_ciphertext: string;
  body_iv: string;
  body_tag: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user)
    return Response.json(
      { error: "Authentication is required" },
      { status: 401 },
    );
  const { id } = await context.params;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("final_papers")
    .select(
      "id, owner_id, proposal_id, version, title, body_ciphertext, body_iv, body_tag",
    )
    .eq("id", id)
    .eq("owner_id", authData.user.id)
    .single();
  if (error || !data)
    return Response.json({ error: "Final paper not found" }, { status: 404 });
  const row = data as FinalPaperRow;
  const env = readServerEnv();
  const markdown = decryptText(
    {
      version: 1,
      algorithm: "aes-256-gcm",
      ciphertext: row.body_ciphertext,
      iv: row.body_iv,
      tag: row.body_tag,
    },
    env.DATA_ENCRYPTION_KEY,
    `${row.owner_id}:${row.proposal_id}:final:${row.version}`,
  );
  const filename =
    row.title.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 100) || "paper";
  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.md`,
      "cache-control": "no-store, private",
      "x-content-type-options": "nosniff",
    },
  });
}

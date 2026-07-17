import { z } from "zod";

import { extractProposalText } from "@/lib/documents/extract";
import { validateProposalUpload } from "@/lib/documents/validate";
import { readServerEnv } from "@/lib/env/schema";
import { assertSameOrigin } from "@/lib/http/same-origin";
import { encryptText } from "@/lib/security/envelope";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AGENT_SEQUENCE } from "@/swarm/agents";

export const runtime = "nodejs";

const titleSchema = z.string().trim().min(3).max(300);

function responseError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Proposal upload failed";
  const status = /auth/i.test(message)
    ? 401
    : /origin|20 MiB|MIME|signature|UTF-8|supported|empty|match/i.test(message)
      ? 400
      : 500;
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let uploadedPath: string | undefined;
  let proposalId: string | undefined;
  try {
    assertSameOrigin(request);
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 22 * 1024 * 1024)
      throw new Error("Multipart request exceeds the 20 MiB file limit");
    const userClient = await createServerSupabaseClient();
    const { data: authData, error: authError } =
      await userClient.auth.getUser();
    if (authError || !authData.user)
      throw new Error("Authentication is required");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("A proposal file is required");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validated = validateProposalUpload({
      name: file.name,
      type: file.type,
      size: file.size,
      bytes,
    });
    const extractedText = await extractProposalText(bytes, validated.mimeType);
    const requestedTitle = form.get("title");
    const fallbackTitle = validated.safeFilename
      .slice(0, -validated.extension.length)
      .replace(/_/g, " ");
    const title = titleSchema.parse(
      typeof requestedTitle === "string" && requestedTitle.trim()
        ? requestedTitle
        : fallbackTitle,
    );

    const env = readServerEnv();
    const admin = getSupabaseAdmin();
    proposalId = crypto.randomUUID();
    const runId = crypto.randomUUID();
    uploadedPath = `${authData.user.id}/${proposalId}/${validated.safeFilename}`;
    const envelope = encryptText(
      extractedText,
      env.DATA_ENCRYPTION_KEY,
      `${authData.user.id}:${proposalId}`,
    );
    const { error: storageError } = await admin.storage
      .from("proposals")
      .upload(uploadedPath, bytes, {
        contentType: validated.mimeType,
        upsert: false,
      });
    if (storageError)
      throw new Error(`Private storage upload failed: ${storageError.message}`);

    const { error: proposalError } = await admin.from("proposals").insert({
      id: proposalId,
      owner_id: authData.user.id,
      title,
      original_filename: file.name.slice(0, 255),
      mime_type: validated.mimeType,
      byte_size: file.size,
      storage_path: uploadedPath,
      extracted_content_ciphertext: envelope.ciphertext,
      extracted_content_iv: envelope.iv,
      extracted_content_tag: envelope.tag,
      status: "queued",
    });
    if (proposalError)
      throw new Error(
        `Proposal record creation failed: ${proposalError.message}`,
      );

    const { error: runError } = await admin.from("pipeline_runs").insert({
      id: runId,
      proposal_id: proposalId,
      owner_id: authData.user.id,
      status: "queued",
    });
    if (runError)
      throw new Error(`Pipeline queue creation failed: ${runError.message}`);

    const { error: statusError } = await admin.from("agent_status").insert(
      AGENT_SEQUENCE.map((role) => ({
        proposal_id: proposalId,
        pipeline_run_id: runId,
        owner_id: authData.user.id,
        role,
        state: "idle",
        progress: 0,
        current_task: "파이프라인 대기 중",
      })),
    );
    if (statusError)
      throw new Error(`Agent initialization failed: ${statusError.message}`);
    return Response.json({ proposalId, runId }, { status: 201 });
  } catch (error) {
    const admin = getSupabaseAdmin();
    if (proposalId) await admin.from("proposals").delete().eq("id", proposalId);
    if (uploadedPath)
      await admin.storage.from("proposals").remove([uploadedPath]);
    return responseError(error);
  }
}

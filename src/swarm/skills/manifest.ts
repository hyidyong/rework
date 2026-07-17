import { z } from "zod";

import { agentRoleSchema } from "../contracts";

export const remoteSkillManifestSchema = z
  .object({
    name: z.string().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    role: agentRoleSchema,
    promptUrl: z.string().url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export type RemoteSkillManifest = z.infer<typeof remoteSkillManifestSchema>;

export type VerifiedSkill = {
  manifest: RemoteSkillManifest;
  prompt: string;
};

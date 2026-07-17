import { z } from "zod";

const encryptionKeySchema = z.string().superRefine((value, context) => {
  const decoded = Buffer.from(value, "base64");

  if (decoded.length !== 32 || decoded.toString("base64") !== value) {
    context.addIssue({
      code: "custom",
      message: "DATA_ENCRYPTION_KEY must be a canonical base64 value containing exactly 32 bytes",
    });
  }
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_DB_URL: z.string().min(20).optional(),
  OPENAI_API_KEY: z.union([z.string().min(20), z.literal("")]).default(""),
  DATA_ENCRYPTION_KEY: encryptionKeySchema,
  OPENAI_MODEL: z.string().min(1).default("gpt-5.6-terra"),
  MCP_SERVERS_JSON: z.string().default("[]"),
  SKILL_REGISTRY_ALLOWLIST: z.string().default(""),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type EnvironmentSource = Record<string, string | undefined>;

export function readPublicEnv(source: EnvironmentSource = process.env): PublicEnv {
  return publicEnvSchema.parse(source);
}

export function readServerEnv(source: EnvironmentSource = process.env): ServerEnv {
  return serverEnvSchema.parse(source);
}

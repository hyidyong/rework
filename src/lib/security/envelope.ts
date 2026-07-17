import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

export interface CipherEnvelope {
  version: 1;
  algorithm: typeof ALGORITHM;
  iv: string;
  ciphertext: string;
  tag: string;
}

function decodeKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");

  if (key.length !== 32 || key.toString("base64") !== base64Key) {
    throw new Error("Encryption key must be a canonical base64 value containing exactly 32 bytes");
  }

  return key;
}

export function encryptText(
  plainText: string,
  base64Key: string,
  associatedData: string,
): CipherEnvelope {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, decodeKey(base64Key), iv);
  cipher.setAAD(Buffer.from(associatedData, "utf8"));

  const ciphertext = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  return {
    version: 1,
    algorithm: ALGORITHM,
    iv: iv.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
  };
}

export function decryptText(
  envelope: CipherEnvelope,
  base64Key: string,
  associatedData: string,
): string {
  if (envelope.version !== 1 || envelope.algorithm !== ALGORITHM) {
    throw new Error("Unsupported cipher envelope");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    decodeKey(base64Key),
    Buffer.from(envelope.iv, "base64url"),
  );
  decipher.setAAD(Buffer.from(associatedData, "utf8"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}


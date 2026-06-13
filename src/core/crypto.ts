import crypto from "node:crypto";
import { promisify } from "node:util";
import { FriendlyError } from "./errors.js";

const scryptAsync = promisify(crypto.scrypt);

export type EncryptedPayload = {
  v: 1;
  kdf: "scrypt";
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
  meta: Record<string, string | number>;
};

export async function encryptBytes(bytes: Buffer, passphrase: string, meta: Record<string, string | number>): Promise<string> {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = (await scryptAsync(passphrase, salt, 32)) as Buffer;
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedPayload = {
    v: 1,
    kdf: "scrypt",
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    meta,
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export async function decryptBytes(encoded: string, passphrase: string): Promise<{ bytes: Buffer; meta: Record<string, string | number> }> {
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as EncryptedPayload;
    const key = (await scryptAsync(passphrase, Buffer.from(payload.salt, "base64"), 32)) as Buffer;
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "base64"));
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    const bytes = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]);
    return { bytes, meta: payload.meta ?? {} };
  } catch {
    throw new FriendlyError(
      "The passphrase did not unlock this handoff.",
      "Enter the exact passphrase used during send.",
    );
  }
}

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export function createSessionKey() { return randomBytes(32); }

export function sealMessage(plaintext, key, metadata = {}) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error("session key must be 32 bytes");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  return {
    version: 1,
    algorithm: "A256GCM",
    nonce: nonce.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    metadata
  };
}

export function openMessage(envelope, key) {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.nonce, "base64url"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

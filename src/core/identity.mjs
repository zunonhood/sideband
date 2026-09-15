import { createHash, randomBytes } from "node:crypto";

export function normalizeHandle(value) {
  const handle = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,30}$/.test(handle)) throw new Error("invalid identity handle");
  return handle.includes(".") ? handle : `${handle}.sideband`;
}

export function createIdentity(handle, chainId = 4663) {
  const normalized = normalizeHandle(handle);
  const seed = randomBytes(32);
  const commitment = createHash("sha256").update(seed).update(normalized).digest("hex");
  return {
    handle: normalized,
    account: `0x${commitment.slice(0, 40)}`,
    deviceCommitment: `0x${commitment}`,
    chainId,
    signer: "Local device",
    recoveryReady: false
  };
}

export function publicIdentity(identity) {
  const { handle, account, chainId, deviceCommitment, recoveryReady } = identity;
  return { handle, account, chainId, deviceCommitment, recoveryReady };
}

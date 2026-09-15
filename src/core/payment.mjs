import { createHash, randomUUID } from "node:crypto";

export function settleDemoPayment(state, { contactId, amount, asset = "USDC", memo = "" }) {
  if (!state.contacts.some(contact => contact.id === contactId)) throw new Error("recipient not found");
  if (!(amount > 0) || !Number.isFinite(amount)) throw new Error("invalid amount");
  if ((state.balances[asset] || 0) < amount) throw new Error("insufficient balance");
  state.balances[asset] = Number((state.balances[asset] - amount).toFixed(6));
  const id = randomUUID();
  const transaction = {
    id,
    hash: `0x${createHash("sha256").update(id).digest("hex")}`,
    mode: "simulation",
    chainId: state.identity.chainId,
    contactId,
    amount,
    asset,
    memo,
    status: "confirmed",
    createdAt: new Date().toISOString()
  };
  state.transactions.unshift(transaction);
  return transaction;
}

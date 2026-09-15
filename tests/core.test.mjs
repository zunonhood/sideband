import test from "node:test";
import assert from "node:assert/strict";
import { normalizeHandle, createIdentity, publicIdentity } from "../src/core/identity.mjs";
import { authorize, PolicyError, setPolicyActive } from "../src/core/policy.mjs";
import { createSessionKey, openMessage, sealMessage } from "../src/core/message.mjs";
import { settleDemoPayment } from "../src/core/payment.mjs";

test("identity handles are normalized and public views omit secrets", () => {
  assert.equal(normalizeHandle("Alice"), "alice.sideband");
  assert.throws(() => normalizeHandle("a"), /invalid/);
  const identity = createIdentity("alice");
  assert.equal(identity.chainId, 4663);
  assert.equal(publicIdentity(identity).handle, "alice.sideband");
});

test("message envelopes round-trip with authenticated encryption", () => {
  const key = createSessionKey();
  const envelope = sealMessage("hello sideband", key, { contactId: "mira" });
  assert.equal(openMessage(envelope, key), "hello sideband");
  const wrongKey = createSessionKey();
  assert.throws(() => openMessage(envelope, wrongKey));
});

test("policy engine accepts an in-limit payment and rejects excess", () => {
  const policy = { id: "market.pay", app: "Market", scope: "wallet:send", active: true, spendLimit: 50, asset: "USDC", expiresAt: "2099-01-01T00:00:00.000Z" };
  assert.equal(authorize({ app: "Market", scope: "wallet:send", amount: 12, asset: "USDC" }, policy).authorized, true);
  assert.throws(() => authorize({ app: "Market", scope: "wallet:send", amount: 51, asset: "USDC" }, policy), PolicyError);
  setPolicyActive([policy], "market.pay", false);
  assert.throws(() => authorize({ app: "Market", scope: "wallet:send", amount: 1, asset: "USDC" }, policy), /revoked/);
});

test("demo settlement mutates balance and records a transaction", () => {
  const state = { identity: { chainId: 4663 }, contacts: [{ id: "mira" }], balances: { USDC: 20 }, transactions: [] };
  const transaction = settleDemoPayment(state, { contactId: "mira", amount: 12, asset: "USDC", memo: "relay" });
  assert.equal(state.balances.USDC, 8);
  assert.equal(state.transactions.length, 1);
  assert.equal(transaction.status, "confirmed");
  assert.match(transaction.hash, /^0x[0-9a-f]{64}$/);
});

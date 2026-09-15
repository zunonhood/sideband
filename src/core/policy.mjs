export class PolicyError extends Error {
  constructor(message, code = "POLICY_DENIED") { super(message); this.name = "PolicyError"; this.code = code; }
}

export function authorize(intent, policy, now = Date.now()) {
  if (!policy?.active) throw new PolicyError("capability revoked");
  if (new Date(policy.expiresAt).getTime() <= now) throw new PolicyError("capability expired");
  if (intent.app !== policy.app) throw new PolicyError("application mismatch");
  if (!policy.scope.split(" ").includes(intent.scope)) throw new PolicyError("scope not granted");
  if (intent.scope === "wallet:send") {
    if (intent.asset !== policy.asset) throw new PolicyError("asset not permitted");
    if (!(intent.amount > 0) || intent.amount > policy.spendLimit) throw new PolicyError("spend limit exceeded");
  }
  return { authorized: true, policyId: policy.id, requiresPresence: intent.scope === "wallet:send" };
}

export function setPolicyActive(policies, id, active) {
  const policy = policies.find(item => item.id === id);
  if (!policy) throw new PolicyError("policy not found", "NOT_FOUND");
  policy.active = Boolean(active);
  return policy;
}

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { JsonStore } from "./src/store.mjs";
import { authorize, setPolicyActive } from "./src/core/policy.mjs";
import { settleDemoPayment } from "./src/core/payment.mjs";
import { readRepositoryFile, repositoryTree } from "./src/repository.mjs";

const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const store = new JsonStore(resolve(root, "data/state.json"));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".sol": "text/plain; charset=utf-8", ".swift": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png" };

function json(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function body(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function api(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    return json(response, 200, { ok: true, version: "0.2.0", mode: "simulation", chainId: 4663 });
  }
  if (request.method === "GET" && url.pathname === "/api/system") {
    const state = await store.read();
    return json(response, 200, { identity: state.identity, balances: state.balances, policies: state.policies, recentTransactions: state.transactions.slice(0, 5) });
  }
  if (request.method === "GET" && url.pathname === "/api/contacts") {
    return json(response, 200, (await store.read()).contacts);
  }
  if (url.pathname === "/api/messages" && request.method === "GET") {
    const state = await store.read();
    const contactId = url.searchParams.get("contactId");
    return json(response, 200, contactId ? state.messages.filter(message => message.contactId === contactId) : state.messages);
  }
  if (url.pathname === "/api/messages" && request.method === "POST") {
    const input = await body(request);
    if (!input.contactId || !String(input.body || "").trim()) return json(response, 400, { error: "contactId and body are required" });
    const message = await store.update(state => {
      if (!state.contacts.some(contact => contact.id === input.contactId)) throw new Error("contact not found");
      const value = { id: `msg_${Date.now()}`, contactId: input.contactId, direction: "out", body: String(input.body).trim().slice(0, 4000), createdAt: new Date().toISOString() };
      state.messages.push(value);
      return value;
    });
    return json(response, 201, message);
  }
  if (request.method === "GET" && url.pathname === "/api/policies") {
    return json(response, 200, (await store.read()).policies);
  }
  if (request.method === "PATCH" && url.pathname.startsWith("/api/policies/")) {
    const id = decodeURIComponent(url.pathname.slice("/api/policies/".length));
    const input = await body(request);
    const policy = await store.update(state => setPolicyActive(state.policies, id, input.active));
    return json(response, 200, policy);
  }
  if (request.method === "POST" && url.pathname === "/api/payments") {
    const input = await body(request);
    const transaction = await store.update(state => {
      const policy = state.policies.find(item => item.id === "market.pay");
      authorize({ app: "Market", scope: "wallet:send", amount: Number(input.amount), asset: input.asset || "USDC" }, policy);
      return settleDemoPayment(state, { contactId: input.contactId, amount: Number(input.amount), asset: input.asset || "USDC", memo: input.memo });
    });
    return json(response, 201, transaction);
  }
  if (request.method === "GET" && url.pathname === "/api/transactions") {
    return json(response, 200, (await store.read()).transactions);
  }
  if (request.method === "GET" && url.pathname === "/api/repository") {
    return json(response, 200, repositoryTree());
  }
  if (request.method === "GET" && url.pathname === "/api/source") {
    const path = url.searchParams.get("path") || "";
    return json(response, 200, { path, source: await readRepositoryFile(root, path) });
  }
  return json(response, 404, { error: "API route not found" });
}

async function handler(request, response) {
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  try {
    if (url.pathname.startsWith("/api/")) return await api(request, response, url);
    const safe = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = join(root, url.pathname === "/" ? "workbench.html" : safe);
    if (!file.startsWith(root) || !existsSync(file)) return json(response, 404, { error: "not found" });
    if (statSync(file).isDirectory()) file = join(file, "index.html");
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(file).on("error", () => response.destroy()).pipe(response);
  } catch (error) {
    const status = error.code === "NOT_FOUND" ? 404 : /not found|not public|invalid path/.test(error.message) ? 404 : /required|invalid|denied|revoked|expired|limit|insufficient/.test(error.message) ? 400 : 500;
    json(response, status, { error: error.message });
  }
}

createServer(handler).listen(port, "127.0.0.1", () => console.log(`Sideband v0.2.0 running at http://127.0.0.1:${port} (simulation mode)`));

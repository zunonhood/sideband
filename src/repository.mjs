import { readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

export const repositoryFiles = [
  "README.md", "package.json", ".env.example", "config/network.json", "sideband.png", "logo-system.css", "narrative.css", "phone-os.css", "phone-product.css", "phone-screens.css", "server.mjs",
  "src/store.mjs", "src/repository.mjs",
  "src/core/identity.mjs", "src/core/policy.mjs", "src/core/message.mjs", "src/core/payment.mjs",
  "contracts/SidebandAccount.sol", "contracts/IdentityRegistry.sol", "contracts/PermissionPolicy.sol",
  "ios/Sideband/SidebandApp.swift", "ios/Sideband/APIClient.swift", "ios/Sideband/Models.swift",
  "ios/Sideband/LocalVault.swift", "ios/Sideband/ContactService.swift", "ios/Sideband/MessageService.swift",
  "ios/Sideband/Resources/sideband.png",
  "tests/core.test.mjs",
  "workbench.html", "workbench.css", "workbench-right.css", "workbench-polish.css",
  "iphone-real.css", "iphone-clean.css", "repo-comfort.css", "clarity.css",
  "layout-final.css", "repo-inline.css", "workbench.js"
];

export function repositoryTree() {
  const root = {};
  for (const path of repositoryFiles) {
    const parts = path.split("/");
    let node = root;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) node[part] = { type: "file", path };
      else node = node[part] ||= { type: "directory", children: {} }, node = node.children;
    });
  }
  return root;
}

export async function readRepositoryFile(root, requestedPath) {
  if (!repositoryFiles.includes(requestedPath)) throw new Error("file is not public");
  const absolute = resolve(root, requestedPath);
  if (relative(root, absolute).startsWith("..")) throw new Error("invalid path");
  return readFile(absolute, "utf8");
}

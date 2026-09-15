import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonStore {
  constructor(path) { this.path = path; this.queue = Promise.resolve(); }
  async read() { return JSON.parse(await readFile(this.path, "utf8")); }
  async update(mutator) {
    const operation = this.queue.then(async () => {
      const state = await this.read();
      const result = await mutator(state);
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.tmp`;
      await writeFile(temporary, JSON.stringify(state, null, 2) + "\n", "utf8");
      await rename(temporary, this.path);
      return result;
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
}

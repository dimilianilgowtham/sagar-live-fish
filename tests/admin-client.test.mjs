import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../src/lib/admin-client.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { adminRequest } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("owner API accepts JSON and supplies credentials without leaking into the URL", async t => {
  t.mock.method(globalThis, "fetch", async (path, options) => {
    assert.equal(path, "/api/admin/products");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    return Response.json({ revision: 1 });
  });
  assert.deepEqual(await adminRequest("/api/admin/products"), { revision: 1 });
});
test("expired owner sessions show recovery instructions", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Please sign in" }, { status: 401 }));
  await assert.rejects(() => adminRequest("/api/admin/products"), error => error.status === 401 && /draft|edits are kept/i.test(error.message));
});
test("a malformed success response is rejected instead of replacing the catalogue with null", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response("bad gateway", { status: 200 }));
  await assert.rejects(() => adminRequest("/api/admin/products"), error => error.status === 502 && /unreadable/.test(error.message));
});
test("a stalled mobile request times out and preserves the draft", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis, "fetch", (_path, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })));
  const pending = adminRequest("/api/admin/products");
  const rejection = assert.rejects(() => pending, error => error.status === 0 && /took too long/.test(error.message));
  t.mock.timers.tick(15_001);
  await rejection;
});

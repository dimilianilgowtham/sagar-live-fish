import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { performance } from "node:perf_hooks";
import { createDatabase } from "../src/lib/server/database.ts";
import { getCatalogue, updateProduct } from "../src/lib/server/catalogue.ts";
import { createOwner, authenticateOwner } from "../src/lib/server/auth.ts";

test("four concurrent database clients preserve snapshots, all committed edits and audit records", { timeout: 60_000 }, async t => {
  const directory = mkdtempSync(join(tmpdir(), "sagar-load-test-"));
  const path = join(directory, "isolated.sqlite");
  const db = createDatabase(path);
  updateProduct(db, "catla", { pricePerKg: 2 }, 1);
  const started = performance.now();
  const workers = [];
  try {
    const runs = Array.from({ length: 4 }, (_, id) => new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./database-stress-worker.mjs", import.meta.url), { workerData: { path, id }, execArgv: ["--experimental-strip-types"] });
      workers.push(worker);
      worker.once("message", resolve);
      worker.once("error", reject);
      worker.once("exit", code => { if (code) reject(new Error(`Worker exited with ${code}`)); });
    }));
    const clients = await Promise.all(runs);
    const final = getCatalogue(db);
    assert.equal(clients.reduce((sum, client) => sum + client.writes, 0), 400);
    assert.equal(final.revision, 402);
    assert.equal(final.products.find(product => product.id === "catla").pricePerKg, 402);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM catalogue_history").get().count, 401);
    assert.equal(db.prepare("PRAGMA quick_check").get().quick_check, "ok");
    t.diagnostic(JSON.stringify({ clients: 4, reads: clients.reduce((sum, client) => sum + client.reads, 0), committedWrites: 400, rejectedStaleWrites: clients.reduce((sum, client) => sum + client.conflicts, 0), elapsedMs: Math.round(performance.now() - started), integrity: "ok" }));
  } finally {
    await Promise.all(workers.map(worker => worker.terminate()));
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a sign-in burst is bounded instead of starting unbounded password work", async t => {
  const db = createDatabase(":memory:");
  try {
    await createOwner(db, { name: "Stress Owner", email: "owner", password: "stress-owner-password-2026" });
    const results = await Promise.allSettled(Array.from({ length: 20 }, (_, index) => authenticateOwner(db, "owner", "stress-owner-password-2026", `client-${index}`)));
    const accepted = results.filter(result => result.status === "fulfilled").length;
    const limited = results.filter(result => result.status === "rejected" && result.reason.status === 429).length;
    assert.ok(accepted >= 1 && accepted <= 2);
    assert.equal(accepted + limited, 20);
    t.diagnostic(JSON.stringify({ attempted: 20, accepted, safelyRateLimited: limited, unexpectedErrors: 0 }));
  } finally { db.close(); }
});

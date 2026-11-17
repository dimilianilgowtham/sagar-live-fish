import assert from "node:assert/strict";
import { workerData, parentPort } from "node:worker_threads";
import { setTimeout } from "node:timers/promises";
import { createDatabase } from "../src/lib/server/database.ts";
import { getCatalogue, updateProduct } from "../src/lib/server/catalogue.ts";

const db = createDatabase(workerData.path);
let reads = 0, conflicts = 0, writes = 0;
const snapshot = () => {
  const value = getCatalogue(db);
  reads++;
  assert.equal(value.products.length, 8);
  assert.equal(value.products.find(product => product.id === "catla").pricePerKg, value.revision, "revision and price must come from the same read snapshot");
  return value;
};
try {
  for (let index = 0; index < 100; index++) {
    for (let read = 0; read < 25; read++) snapshot();
    for (let attempt = 0; ; attempt++) {
      const current = snapshot();
      try {
        updateProduct(db, "catla", { pricePerKg: current.revision + 1 }, current.revision, { name: `Stress worker ${workerData.id}`, email: "stress@example.test" });
        writes++;
        break;
      } catch (failure) {
        if ((failure.status !== 409 && failure.code !== "ERR_SQLITE_ERROR") || attempt >= 99) throw failure;
        conflicts++;
        await setTimeout(1);
      }
    }
  }
  parentPort.postMessage({ reads, writes, conflicts });
} finally { db.close(); }

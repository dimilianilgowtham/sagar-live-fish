import assert from "node:assert/strict";
import test from "node:test";
import * as catalogueHistory from "../src/lib/server/catalogue.ts";
import { createDatabase } from "../src/lib/server/database.ts";
import {
  getCatalogue,
  createProduct,
  updateProduct,
  archiveProduct,
  bulkAvailability,
} from "../src/lib/server/catalogue.ts";
import {
  hashPassword,
  verifyPassword,
  createOwner,
  getOwner,
  authenticateOwner,
  createSession,
  findSession,
  revokeSession,
  consumeLoginAttempt,
} from "../src/lib/server/auth.ts";
import {
  assertSameOrigin,
  isLocalSetupAllowed,
} from "../src/lib/server/request-security.ts";

const draft = {
  nameEn: "Test Fish",
  nameTe: "పరీక్ష చేప",
  category: "freshwater",
  descEn: "Fresh fish for curry.",
  descTe: "తాజా చేప.",
  pricePerKg: 300,
  isAvailable: true,
  badge: "Fresh catch",
  cuts: ["Curry cut", "Whole cleaned"],
  image: "/images/hero.webp",
};
const withDb = async (fn) => {
  const db = createDatabase(":memory:");
  try {
    await fn(db);
  } finally {
    db.close();
  }
};

test("catalogue is seeded once and public reads reflect owner edits", () =>
  withDb((db) => {
    const before = getCatalogue(db);
    assert.equal(before.products.length, 8);
    const next = updateProduct(
      db,
      "catla",
      { pricePerKg: 275, isAvailable: false },
      before.revision,
    );
    const after = getCatalogue(db);
    assert.equal(after.products.find((p) => p.id === "catla").pricePerKg, 275);
    assert.equal(
      after.products.find((p) => p.id === "catla").isAvailable,
      false,
    );
    assert.equal(next.revision, before.revision + 1);
  }));

test("new products support full data, image and null prices", () =>
  withDb((db) => {
    const next = createProduct(
      db,
      { ...draft, pricePerKg: null },
      getCatalogue(db).revision,
    );
    const product = next.products.find((p) => p.nameEn === "Test Fish");
    assert.equal(product.image, "/images/hero.webp");
    assert.equal(product.pricePerKg, null);
    assert.deepEqual(product.cuts, ["Curry cut", "Whole cleaned"]);
  }));

test("invalid prices, cuts, image paths and names are rejected without changing stock", () =>
  withDb((db) => {
    for (const patch of [
      { pricePerKg: -1 },
      { pricePerKg: "100" },
      { cuts: [] },
      { image: "https://evil.example/track.svg" },
      { image: "/api/media/../../secret" },
      { nameEn: "" },
      { isAvailable: "yes" },
    ]) {
      assert.throws(
        () => updateProduct(db, "catla", patch, getCatalogue(db).revision),
        (error) => error.status === 400,
      );
    }
    assert.equal(getCatalogue(db).products[0].pricePerKg, 240);
  }));

test("archive hides products from customers and restore retains them", () =>
  withDb((db) => {
    const archived = archiveProduct(db, "catla", getCatalogue(db).revision);
    assert.equal(
      getCatalogue(db).products.some((p) => p.id === "catla"),
      false,
    );
    assert.equal(
      archived.products.find((p) => p.id === "catla").archived,
      true,
    );
    updateProduct(db, "catla", { archived: false }, archived.revision);
    assert.equal(
      getCatalogue(db).products.find((p) => p.id === "catla").pricePerKg,
      240,
    );
  }));

test("stale catalogue writes cannot overwrite another owner update", () =>
  withDb((db) => {
    const revision = getCatalogue(db).revision;
    updateProduct(db, "catla", { pricePerKg: 250 }, revision);
    assert.throws(
      () => updateProduct(db, "catla", { pricePerKg: 1 }, revision),
      (error) => error.status === 409,
    );
    assert.equal(getCatalogue(db).products[0].pricePerKg, 250);
  }));

test("bulk stock updates are shared and leave archived products untouched", () =>
  withDb((db) => {
    const archived = archiveProduct(db, "catla", getCatalogue(db).revision);
    const updated = bulkAvailability(db, false, archived.revision);
    assert.ok(getCatalogue(db).products.every((p) => !p.isAvailable));
    assert.equal(
      updated.products.find((p) => p.id === "catla").isAvailable,
      true,
    );
  }));

test("owner passwords use independent salts and verify without exposing plaintext", async () => {
  const first = await hashPassword("a-long-test-password");
  const second = await hashPassword("a-long-test-password");
  assert.notEqual(first, second);
  assert.equal(first.includes("a-long-test-password"), false);
  assert.equal(await verifyPassword("a-long-test-password", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  assert.equal(await verifyPassword("a-long-test-password", "invalid"), false);
});

test("only one owner can be created and invalid credentials never log in", () =>
  withDb(async (db) => {
    await createOwner(db, {
      name: "Test Owner",
      email: "owner@example.test",
      password: "a-long-test-password",
    });
    assert.equal(getOwner(db).name, "Test Owner");
    await assert.rejects(
      () =>
        createOwner(db, {
          name: "Another",
          email: "other@example.test",
          password: "another-test-password",
        }),
      (error) => error.status === 409,
    );
    assert.equal(
      (
        await authenticateOwner(
          db,
          "OWNER@example.test",
          "a-long-test-password",
        )
      ).email,
      "owner@example.test",
    );
    await assert.rejects(
      () => authenticateOwner(db, "owner@example.test", "wrong-password"),
      (error) => error.status === 401,
    );
  }));

test("sessions expire and logout revokes the server-side token", () =>
  withDb(async (db) => {
    await createOwner(db, {
      name: "Test Owner",
      email: "owner@example.test",
      password: "a-long-test-password",
    });
    const now = Date.now();
    const session = createSession(db, now);
    assert.equal(
      findSession(db, session.token, now).email,
      "owner@example.test",
    );
    assert.equal(findSession(db, "fake-token", now), null);
    assert.equal(findSession(db, session.token, session.expiresAt + 1), null);
    const second = createSession(db, now);
    revokeSession(db, second.token);
    assert.equal(findSession(db, second.token, now), null);
  }));

test("login attempts are rate limited persistently", () =>
  withDb((db) => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) consumeLoginAttempt(db, now);
    assert.throws(
      () => consumeLoginAttempt(db, now),
      (error) => error.status === 429,
    );
    assert.doesNotThrow(() => consumeLoginAttempt(db, now + 16 * 60 * 1000));
  }));

test("unsafe requests require a matching origin and setup is development-loopback only", () => {
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request("http://127.0.0.1:3000/api/admin/products", {
        method: "POST",
        headers: { origin: "http://127.0.0.1:3000" },
      }),
    ),
  );
  assert.throws(
    () =>
      assertSameOrigin(
        new Request("http://127.0.0.1:3000/api/admin/products", {
          method: "POST",
          headers: { origin: "https://evil.example" },
        }),
      ),
    (error) => error.status === 403,
  );
  assert.throws(
    () =>
      assertSameOrigin(
        new Request("http://127.0.0.1:3000/api/admin/products", {
          method: "POST",
        }),
      ),
    (error) => error.status === 403,
  );
  assert.equal(isLocalSetupAllowed("127.0.0.1:3000", "development"), true);
  assert.equal(isLocalSetupAllowed("localhost:3000", "production"), false);
  assert.equal(isLocalSetupAllowed("shop.example", "development"), false);
  assert.equal(
    isLocalSetupAllowed("localhost.evil.example", "development"),
    false,
  );
});

test("uploaded photos are re-encoded and unsafe files are rejected", () =>
  withDb(async (db) => {
    const { storeImage, getImage } = await import("../src/lib/server/media.ts");
    const sharp = (await import("sharp")).default;
    const valid = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "#ffffff" },
    })
      .png()
      .toBuffer();
    const saved = await storeImage(
      db,
      new File([valid], "fish.png", { type: "image/png" }),
    );
    assert.match(saved.image, /^\/api\/media\/[a-f0-9-]+$/);
    const image = getImage(db, saved.image.split("/").pop());
    assert.equal(image.contentType, "image/webp");
    assert.equal((await sharp(image.data).metadata()).format, "webp");
    await assert.rejects(
      () =>
        storeImage(
          db,
          new File(['<svg onload="alert(1)"></svg>'], "fish.svg", {
            type: "image/svg+xml",
          }),
        ),
      (error) => error.status === 400,
    );
    await assert.rejects(
      () =>
        storeImage(
          db,
          new File(["not a photo"], "fish.png", { type: "image/png" }),
        ),
      (error) => error.status === 400,
    );
  }));

test("catalogue edits survive closing and reopening the shared database", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = mkdtempSync(join(tmpdir(), "sagar-database-test-"));
  const path = join(directory, "catalogue.sqlite");
  let db = createDatabase(path);
  try {
    updateProduct(db, "catla", { pricePerKg: 299 }, getCatalogue(db).revision);
    db.close();
    db = createDatabase(path);
    assert.equal(getCatalogue(db).products.length, 8);
    assert.equal(
      getCatalogue(db).products.find((p) => p.id === "catla").pricePerKg,
      299,
    );
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("proxy-internal request URLs do not reject legitimate browser origins", () => {
  const valid = new Request("http://localhost:3000/api/admin/login", {
    method: "POST",
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
  });
  assert.doesNotThrow(() => assertSameOrigin(valid));
  const production = new Request("http://127.0.0.1:3000/api/admin/login", {
    method: "POST",
    headers: {
      host: "sagarlivefish.example",
      origin: "https://sagarlivefish.example",
    },
  });
  assert.doesNotThrow(() => assertSameOrigin(production));
  const attacker = new Request("http://localhost:3000/api/admin/login", {
    method: "POST",
    headers: { host: "sagarlivefish.example", origin: "https://evil.example" },
  });
  assert.throws(
    () => assertSameOrigin(attacker),
    (error) => error.status === 403,
  );
});

test("one sign-in client cannot lock out another owner browser", () =>
  withDb(async (db) => {
    await createOwner(db, {
      name: "Test Owner",
      email: "owner@example.test",
      password: "a-long-test-password",
    });
    for (let i = 0; i < 10; i++)
      consumeLoginAttempt(db, Date.now(), "attacker-client");
    const owner = await authenticateOwner(
      db,
      "owner@example.test",
      "a-long-test-password",
      "owner-client",
    );
    assert.equal(owner.email, "owner@example.test");
  }));

test("global sign-in budget has a short refill rather than a long shared lockout", async () => {
  const { consumeGlobalLoginBudget } = await import(
    "../src/lib/server/auth.ts"
  );
  await withDb((db) => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) consumeGlobalLoginBudget(db, now);
    assert.throws(
      () => consumeGlobalLoginBudget(db, now),
      (error) => error.status === 429,
    );
    assert.doesNotThrow(() => consumeGlobalLoginBudget(db, now + 1000));
  });
});

test('owner identities cross the React server boundary as plain objects', () => withDb(async db => {
  await createOwner(db,{name:'Test Owner',email:'owner@example.test',password:'a-long-test-password'});
  assert.equal(Object.getPrototypeOf(getOwner(db)),Object.prototype);
  const session=createSession(db);
  assert.equal(Object.getPrototypeOf(findSession(db,session.token)),Object.prototype);
}));

const historyActor = { name: "Catalogue Owner", email: "owner@example.test" };
const history = (db, options) => {
  assert.equal(typeof catalogueHistory.getCatalogueHistory, "function", "catalogue history should be available");
  return catalogueHistory.getCatalogueHistory(db, options);
};

test("history starts empty and records only changed fields with the authenticated actor", () =>
  withDb((db) => {
    assert.deepEqual(history(db), { entries: [], nextCursor: null });
    const before = getCatalogue(db);
    updateProduct(db, "catla", { pricePerKg: 280, isAvailable: false, password: "never-store-this" }, before.revision, { ...historyActor, password: "never-store-this" });
    const { entries } = history(db);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].productId, "catla");
    assert.equal(entries[0].productName, "Catla (Bocche)");
    assert.equal(entries[0].action, "update");
    assert.deepEqual(entries[0].actor, historyActor);
    assert.ok(Number.isFinite(Date.parse(entries[0].occurredAt)));
    assert.deepEqual(entries[0].changes, [
      { field: "pricePerKg", before: 240, after: 280 },
      { field: "isAvailable", before: true, after: false },
    ]);
    assert.equal(JSON.stringify(entries).includes("never-store-this"), false);
    updateProduct(db, "catla", { pricePerKg: 280, isAvailable: false }, getCatalogue(db).revision, historyActor);
    assert.equal(history(db).entries.length, 1, "saving unchanged values must not invent an event");
  }));

test("history distinguishes creation, availability, archive and restore and retains original names", () =>
  withDb((db) => {
    const created = createProduct(db, draft, getCatalogue(db).revision, historyActor);
    const product = created.products.find((item) => item.nameEn === draft.nameEn);
    assert.equal(history(db).entries[0].action, "create");
    assert.ok(history(db).entries[0].changes.every((change) => change.before === null));
    updateProduct(db, product.id, { isAvailable: false }, created.revision, historyActor);
    archiveProduct(db, product.id, getCatalogue(db).revision, historyActor);
    updateProduct(db, product.id, { archived: false }, getCatalogue(db).revision, historyActor);
    updateProduct(db, product.id, { nameEn: "Renamed Fish", pricePerKg: null, cuts: ["Whole cleaned"] }, getCatalogue(db).revision, historyActor);
    const entries = history(db).entries;
    assert.deepEqual(entries.map((entry) => entry.action), ["update", "restore", "archive", "availability", "create"]);
    assert.equal(entries[0].productName, "Renamed Fish");
    assert.equal(entries[4].productName, "Test Fish");
    assert.deepEqual(entries[0].changes.find((change) => change.field === "pricePerKg"), { field: "pricePerKg", before: 300, after: null });
    assert.deepEqual(entries[0].changes.find((change) => change.field === "cuts"), { field: "cuts", before: ["Curry cut", "Whole cleaned"], after: ["Whole cleaned"] });
    assert.equal(entries[2].changes[0].field, "archived");
  }));

test("stale, missing, invalid and unavailable-photo writes do not create history", () =>
  withDb((db) => {
    const revision = getCatalogue(db).revision;
    updateProduct(db, "catla", { pricePerKg: 280 }, revision, historyActor);
    const after = history(db);
    for (const operation of [
      () => updateProduct(db, "catla", { pricePerKg: 1 }, revision, historyActor),
      () => updateProduct(db, "catla", { pricePerKg: -1 }, getCatalogue(db).revision, historyActor),
      () => updateProduct(db, "missing", { pricePerKg: 1 }, getCatalogue(db).revision, historyActor),
      () => createProduct(db, { ...draft, image: "/api/media/00000000-0000-4000-8000-000000000000" }, getCatalogue(db).revision, historyActor),
      () => bulkAvailability(db, "yes", getCatalogue(db).revision, historyActor),
    ]) assert.throws(operation);
    assert.deepEqual(history(db), after);
  }));

test("history insert failures roll back product and catalogue revision changes atomically", () =>
  withDb((db) => {
    assert.equal(history(db).entries.length, 0);
    const before = getCatalogue(db, true);
    db.exec("CREATE TRIGGER reject_test_history BEFORE INSERT ON catalogue_history BEGIN SELECT RAISE(ABORT, 'test storage failure'); END;");
    assert.throws(() => updateProduct(db, "catla", { pricePerKg: 999 }, before.revision, historyActor));
    assert.deepEqual(getCatalogue(db, true), before);
    assert.equal(history(db).entries.length, 0);
  }));

test("bulk history records only changed active products and is append-only", () =>
  withDb((db) => {
    archiveProduct(db, "catla", getCatalogue(db).revision, historyActor);
    updateProduct(db, "korameenu", { isAvailable: false }, getCatalogue(db).revision, historyActor);
    const before = history(db).entries.length;
    bulkAvailability(db, false, getCatalogue(db).revision, historyActor);
    const entries = history(db).entries;
    assert.equal(entries.length - before, 6);
    assert.ok(entries.slice(0, 6).every((entry) => entry.action === "availability" && entry.productId !== "catla" && entry.productId !== "korameenu"));
    bulkAvailability(db, false, getCatalogue(db).revision, historyActor);
    assert.equal(history(db).entries.length, entries.length);
    assert.throws(() => db.prepare("UPDATE catalogue_history SET product_name = ? WHERE id = ?").run("Forged", entries[0].id), /append-only/);
    assert.throws(() => db.prepare("DELETE FROM catalogue_history WHERE id = ?").run(entries[0].id), /append-only/);
    assert.deepEqual(history(db).entries, entries);
  }));

test("history cannot be replaced through SQLite conflict handling", () =>
  withDb((db) => {
    updateProduct(db, "catla", { pricePerKg: 275 }, getCatalogue(db).revision, historyActor);
    const before = history(db);
    assert.throws(() => db.exec(`INSERT OR REPLACE INTO catalogue_history
      SELECT id, product_id, 'Forged name', action, actor_name, actor_email, occurred_at, changes
      FROM catalogue_history;`), /append-only/);
    assert.deepEqual(history(db), before);
  }));

test("history cursor pages stay bounded and stable when new changes arrive", () =>
  withDb((db) => {
    for (let i = 0; i < 5; i++) updateProduct(db, "catla", { pricePerKg: 250 + i }, getCatalogue(db).revision, historyActor);
    const first = history(db, { limit: 2 });
    assert.equal(first.entries.length, 2);
    assert.equal(first.nextCursor, String(first.entries[1].id));
    updateProduct(db, "catla", { pricePerKg: 900 }, getCatalogue(db).revision, historyActor);
    const second = history(db, { limit: 2, cursor: first.nextCursor });
    const last = history(db, { limit: 2, cursor: second.nextCursor });
    assert.equal(second.entries.length, 2);
    assert.equal(last.entries.length, 1);
    assert.equal(last.nextCursor, null);
    const ids = [...first.entries, ...second.entries, ...last.entries].map((entry) => entry.id);
    assert.equal(new Set(ids).size, 5);
    assert.ok(ids.every((id, index) => index === 0 || id < ids[index - 1]));
    for (const cursor of ["", "0", "-1", "1.5", "01", "1 OR 1=1", "9007199254740992", "1".repeat(1000)]) {
      assert.throws(() => history(db, { cursor }), (error) => error.status === 400);
    }
    for (const limit of [0, -1, 101, 1.5, Infinity, "2"]) {
      assert.throws(() => history(db, { limit }), (error) => error.status === 400);
    }
  }));

test("history migrates existing catalogues without backfilling or losing their edits", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = mkdtempSync(join(tmpdir(), "sagar-history-migration-test-"));
  const path = join(directory, "legacy.sqlite");
  let db = new DatabaseSync(path);
  try {
    db.exec("CREATE TABLE catalogue_state (id INTEGER PRIMARY KEY, revision INTEGER NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE products (id TEXT PRIMARY KEY, data TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL);");
    db.prepare("INSERT INTO catalogue_state VALUES (1, 7, ?)").run(new Date().toISOString());
    db.prepare("INSERT INTO products VALUES (?, ?, 0, 0)").run("legacy", JSON.stringify({ ...draft, id: "legacy" }));
    db.close();
    db = createDatabase(path);
    assert.equal(getCatalogue(db).revision, 7);
    assert.equal(getCatalogue(db).products.length, 1);
    assert.equal(history(db).entries.length, 0);
    updateProduct(db, "legacy", { pricePerKg: 310 }, 7, historyActor);
    db.close();
    db = createDatabase(path);
    assert.equal(history(db).entries.length, 1);
    assert.equal(history(db).entries[0].actor.email, historyActor.email);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("history prerender signals bypass application error handling before owner or database access", async () => {
  const { readFile } = await import("node:fs/promises");
  const { transpileModule, ModuleKind, ScriptTarget } = await import("typescript");
  const source = await readFile(new URL("../src/app/api/admin/history/route.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
  });
  const prerenderSignal = new Error("Framework: wait for a real request");
  let ownerReads = 0;
  let databaseReads = 0;
  let handledErrors = 0;
  // Next's request lifecycle needs an isolated harness outside its server.
  const dependencies = {
    "next/server": { connection: async () => { throw prerenderSignal; } },
    "@/lib/server/database": { database: () => { databaseReads++; } },
    "@/lib/server/catalogue": {},
    "@/lib/server/errors": {},
    "@/lib/server/http": {
      requireOwner: async () => { ownerReads++; throw prerenderSignal; },
      api: async (work) => {
        try { return await work(); } catch { handledErrors++; return new Response("Application failure", { status: 500 }); }
      },
    },
  };
  const route = {};
  new Function("require", "exports", outputText)((name) => dependencies[name], route);
  await assert.rejects(() => route.GET(new Request("http://localhost/api/admin/history")), (error) => error === prerenderSignal);
  assert.equal(ownerReads, 0);
  assert.equal(databaseReads, 0);
  assert.equal(handledErrors, 0);
});

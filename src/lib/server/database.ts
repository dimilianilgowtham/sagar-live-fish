import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { INITIAL_PRODUCTS } from "../../data/products.ts";

export function createDatabase(
  path = process.env.SAGAR_DATABASE_PATH ||
    resolve(process.cwd(), ".data/sagar.sqlite"),
) {
  if (process.env.VERCEL && !process.env.SAGAR_DATABASE_PATH)
    throw new Error(
      "Configure durable database storage before deploying the owner dashboard.",
    );
  if (path !== ":memory:")
    mkdirSync(dirname(resolve(/* turbopackIgnore: true */ path)), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  if (path !== ":memory:") chmodSync(path, 0o600);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS catalogue_state (id INTEGER PRIMARY KEY CHECK (id = 1), revision INTEGER NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS owner (id INTEGER PRIMARY KEY CHECK (id = 1), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES owner(id), expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_attempts (id INTEGER PRIMARY KEY CHECK (id = 1), attempts INTEGER NOT NULL, started_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_attempts (client_key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, started_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_budget (id INTEGER PRIMARY KEY CHECK (id = 1), tokens REAL NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, data BLOB NOT NULL, content_type TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS catalogue_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('create', 'update', 'archive', 'restore', 'availability')),
      actor_name TEXT,
      actor_email TEXT,
      occurred_at TEXT NOT NULL,
      changes TEXT NOT NULL,
      CHECK ((actor_name IS NULL AND actor_email IS NULL) OR (actor_name IS NOT NULL AND actor_email IS NOT NULL))
    );
    CREATE TRIGGER IF NOT EXISTS catalogue_history_no_update
      BEFORE UPDATE ON catalogue_history BEGIN
        SELECT RAISE(ABORT, 'Catalogue history is append-only.');
      END;
    CREATE TRIGGER IF NOT EXISTS catalogue_history_no_delete
      BEFORE DELETE ON catalogue_history BEGIN
        SELECT RAISE(ABORT, 'Catalogue history is append-only.');
      END;
    CREATE TRIGGER IF NOT EXISTS catalogue_history_no_replace
      BEFORE INSERT ON catalogue_history
      WHEN EXISTS (SELECT 1 FROM catalogue_history WHERE id = NEW.id) BEGIN
        SELECT RAISE(ABORT, 'Catalogue history is append-only.');
      END;
  `);
  db.exec("BEGIN IMMEDIATE");
  try {
    const seeded = db
      .prepare(
        "INSERT OR IGNORE INTO catalogue_state (id, revision, updated_at) VALUES (1, 1, ?)",
      )
      .run(new Date().toISOString());
    if (seeded.changes) {
      const insert = db.prepare(
        "INSERT INTO products (id, data, sort_order) VALUES (?, ?, ?)",
      );
      INITIAL_PRODUCTS.forEach((product, index) =>
        insert.run(
          product.id,
          JSON.stringify({ ...product, image: `/images/${product.id}.webp` }),
          index,
        ),
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.close();
    throw error;
  }
  return db;
}

const state = globalThis as typeof globalThis & {
  sagarDatabase?: DatabaseSync;
};
export function database() {
  return (state.sagarDatabase ??= createDatabase());
}

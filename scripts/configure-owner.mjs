import { randomBytes } from "node:crypto";
import nextEnv from "@next/env";
import { createDatabase } from "../src/lib/server/database.ts";
import { createOwner, getOwner, hashPassword, normaliseOwnerLogin } from "../src/lib/server/auth.ts";
import { createRotatingBackup } from "../src/lib/server/backup.ts";

// JSON on stdin avoids putting credentials in shell history or process arguments.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
let input = "";
for await (const part of process.stdin) {
  input += part;
  if (input.length > 4096) throw new Error("Owner configuration is too large.");
}
const options = JSON.parse(input || "{}");
const login = normaliseOwnerLogin(options.login || "owner");
if (/\.test$/i.test(login)) throw new Error("Use an owner username or a real email, not a test address.");
const name = String(options.name || "Sagar Live Fish").trim();
if (name.length < 2 || name.length > 120) throw new Error("Choose an owner name of 2–120 characters.");
const password = randomBytes(24).toString("base64url");
const db = createDatabase();
try {
  const existing = getOwner(db);
  if (existing) {
    if (options.replaceDemo !== true || !/\.test$/i.test(existing.email))
      throw new Error("An owner already exists. Change the password from the signed-in owner workspace.");
    const source = process.env.SAGAR_DATABASE_PATH || ".data/sagar.sqlite";
    createRotatingBackup(source);
    const hash = await hashPassword(password);
    db.exec("BEGIN IMMEDIATE");
    try {
      const changed = db.prepare("UPDATE owner SET name = ?, email = ?, password_hash = ? WHERE id = 1 AND email = ?").run(name, login, hash, existing.email);
      if (!changed.changes) throw new Error("The owner changed during setup. No account was replaced.");
      db.exec("DELETE FROM sessions; DELETE FROM login_attempts; DELETE FROM login_budget;");
      db.exec("COMMIT");
    } catch (failure) { db.exec("ROLLBACK"); throw failure; }
  } else await createOwner(db, { name, email: login, password });
  process.stdout.write(`OWNER_CREDENTIALS=${JSON.stringify({ login, password, name })}\n`);
} finally { db.close(); }

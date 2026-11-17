import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";
import { createDatabase } from "../src/lib/server/database.ts";
import { createOwner, getOwner } from "../src/lib/server/auth.ts";
import { createRotatingBackup } from "../src/lib/server/backup.ts";
import { productionConfig } from "../src/lib/server/production-config.ts";

process.env.NODE_ENV = "production";
nextEnv.loadEnvConfig(process.cwd(), false);
let backupTimer;
try {
  const config = productionConfig(process.env);
  const db = createDatabase(config.databasePath);
  try {
    const owner = getOwner(db);
    if (owner && /\.test$/i.test(owner.email))
      throw new Error("Replace the demo owner account before publishing. Use npm run owner:configure.");
    if (!owner) {
      if (!process.env.SAGAR_OWNER_LOGIN || !process.env.SAGAR_OWNER_PASSWORD)
        throw new Error("Configure SAGAR_OWNER_LOGIN and SAGAR_OWNER_PASSWORD privately for the first production start.");
      if (/\.test$/i.test(process.env.SAGAR_OWNER_LOGIN))
        throw new Error("A test email cannot be used as the production owner login.");
      await createOwner(db, {
        name: process.env.SAGAR_OWNER_NAME || "Sagar Live Fish",
        email: process.env.SAGAR_OWNER_LOGIN,
        password: process.env.SAGAR_OWNER_PASSWORD,
      });
      console.log("Owner account initialised. No default password is installed.");
    }
  } finally { db.close(); }

  const backup = () => {
    createRotatingBackup(config.databasePath, process.env.SAGAR_BACKUP_DIR);
    console.log("Verified database backup completed.");
  };
  backup();
  backupTimer = setInterval(() => {
    try { backup(); } catch (failure) { console.error("Daily database backup failed:", failure.message); }
  }, 24 * 60 * 60 * 1000);

  const standalone = process.env.SAGAR_STANDALONE === "1";
  const entry = resolve(standalone ? "server.js" : "node_modules/next/dist/bin/next");
  if (!existsSync(entry)) throw new Error("Build the application before starting production.");
  // Bootstrap secrets are not needed by the public server and are not forwarded.
  delete process.env.SAGAR_OWNER_PASSWORD;
  if (standalone) {
    // One process keeps the production memory budget available to the app.
    process.env.HOSTNAME = "0.0.0.0";
    process.env.PORT = String(config.port);
    await import(pathToFileURL(entry).href);
  } else {
    const serverEnv = { ...process.env, HOSTNAME: "0.0.0.0", PORT: String(config.port) };
    const child = spawn(process.execPath, [entry, "start", "--hostname", "0.0.0.0", "--port", String(config.port)], { stdio: "inherit", env: serverEnv });
    process.on("SIGTERM", () => child.kill("SIGTERM"));
    process.on("SIGINT", () => child.kill("SIGINT"));
    child.on("error", failure => { clearInterval(backupTimer); console.error("Could not start the server:", failure.message); process.exitCode = 1; });
    child.on("exit", code => { clearInterval(backupTimer); process.exitCode = code ?? 0; });
  }
} catch (failure) {
  clearInterval(backupTimer);
  console.error("Production startup stopped:", failure.message);
  process.exitCode = 1;
}

import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabase } from "../src/lib/server/database.ts";
import { getOwner, authenticateOwner } from "../src/lib/server/auth.ts";

const script = name => fileURLToPath(new URL(`../scripts/${name}`, import.meta.url));
test("owner and backup CLIs work in native Node against an isolated database", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sagar-operations-test-"));
  const path = join(directory, "shop.sqlite");
  const env = { ...process.env, SAGAR_DATABASE_PATH: path, NODE_ENV: "development" };
  try {
    const result = spawnSync(process.execPath, ["--experimental-strip-types", script("configure-owner.mjs")], { cwd:directory, env, input: JSON.stringify({ login:"owner", name:"QA Owner" }), encoding:"utf8" });
    assert.equal(result.status, 0, result.stderr);
    const line = result.stdout.split("\n").find(value => value.startsWith("OWNER_CREDENTIALS="));
    assert.ok(line);
    const credentials = JSON.parse(line.slice("OWNER_CREDENTIALS=".length));
    assert.equal(credentials.login, "owner");
    assert.equal(credentials.password.length, 32);
    const db = createDatabase(path);
    try { assert.equal((await authenticateOwner(db, "owner", credentials.password)).name, "QA Owner"); } finally { db.close(); }
    assert.equal(readFileSync(path).includes(Buffer.from(credentials.password)), false);
    const again = spawnSync(process.execPath, ["--experimental-strip-types", script("configure-owner.mjs")], { cwd:directory, env, input:'{"replaceDemo":true}', encoding:"utf8" });
    assert.notEqual(again.status, 0);
    const target = join(directory, "verified.sqlite");
    const backup = spawnSync(process.execPath, ["--experimental-strip-types", script("backup-database.mjs"), target], { cwd:directory, env, encoding:"utf8" });
    assert.equal(backup.status, 0, backup.stderr);
    const restored = createDatabase(target);
    try { assert.equal(getOwner(restored).email, "owner"); } finally { restored.close(); }
  } finally { rmSync(directory, { recursive:true, force:true }); }
});

test("production CLI fails before creating data when the live origin is missing", () => {
  const directory = mkdtempSync(join(tmpdir(), "sagar-startup-test-"));
  const path = join(directory, "must-not-exist.sqlite");
  try {
    const result = spawnSync(process.execPath, ["--experimental-strip-types", script("start-production.mjs")], { cwd:directory, env:{ ...process.env, NEXT_PUBLIC_SITE_URL:"", SAGAR_DATABASE_PATH:path, SAGAR_OWNER_PASSWORD:"must-not-be-logged-2026" }, encoding:"utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Production startup stopped/);
    assert.equal((result.stdout + result.stderr).includes("must-not-be-logged-2026"), false);
    assert.equal(existsSync(path), false);
  } finally { rmSync(directory, { recursive:true, force:true }); }
});

test("the QR export CLI produces PNG, SVG and an A4 poster without external image services", () => {
  const directory = mkdtempSync(join(tmpdir(), "sagar-qr-export-test-"));
  try {
    const result = spawnSync(process.execPath, ["--experimental-strip-types", script("generate-shop-qr.mjs"), "https://sagar-live-fish.shop", directory], { encoding:"utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(directory, "sagar-live-fish-website-qr.png")).subarray(0,8).toString("hex"), "89504e470d0a1a0a");
    assert.match(readFileSync(join(directory, "sagar-live-fish-website-qr.svg"), "utf8"), /crispEdges/);
    const poster = readFileSync(join(directory, "sagar-live-fish-print-poster.html"), "utf8");
    assert.match(poster, /data:image\/png;base64/);
    assert.match(poster, /size:A4/);
    assert.match(poster, /sagar-live-fish\.shop/);
  } finally { rmSync(directory, { recursive:true, force:true }); }
});

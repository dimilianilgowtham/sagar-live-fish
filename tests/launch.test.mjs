import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "../src/lib/server/database.ts";
import { createOwner, authenticateOwner, createSession, findSession, changeOwnerPassword, normaliseOwnerLogin } from "../src/lib/server/auth.ts";
import { getCatalogue, updateProduct, archiveProduct } from "../src/lib/server/catalogue.ts";
import { backupDatabase, createRotatingBackup } from "../src/lib/server/backup.ts";
import { publicSiteOrigin, productionConfig } from "../src/lib/server/production-config.ts";
import { websiteQrSvg, shopQrPoster } from "../src/lib/server/qr.ts";
import { SHOP_DETAILS } from "../src/data/shop.ts";

test("owner can use a normalised username; malformed logins are rejected", async () => {
  for (const invalid of [null, "a", "owner login", "<script>", "@wrong", "a".repeat(255)])
    assert.throws(() => normaliseOwnerLogin(invalid), error => error.status === 400);
  assert.equal(normaliseOwnerLogin(" OWNER "), "owner");
  assert.equal(normaliseOwnerLogin("Shop@Example.com"), "shop@example.com");
  const db = createDatabase(":memory:");
  try {
    await createOwner(db, { name: "Shop Owner", email: "owner", password: "long-owner-password-2026" });
    assert.equal((await authenticateOwner(db, "OWNER", "long-owner-password-2026")).email, "owner");
  } finally { db.close(); }
});

test("changing a password revokes old sessions and accepts only the new password", async () => {
  const db = createDatabase(":memory:");
  try {
    await createOwner(db, { name: "Shop Owner", email: "owner", password: "old-owner-password-2026" });
    const phone = createSession(db);
    const laptop = createSession(db);
    await assert.rejects(() => changeOwnerPassword(db, "owner", "wrong-password", "new-owner-password-2026"), error => error.status === 401);
    assert.ok(findSession(db, phone.token));
    await changeOwnerPassword(db, "owner", "old-owner-password-2026", "new-owner-password-2026");
    assert.equal(findSession(db, phone.token), null);
    assert.equal(findSession(db, laptop.token), null);
    assert.equal((await authenticateOwner(db, "owner", "new-owner-password-2026")).email, "owner");
    await assert.rejects(() => authenticateOwner(db, "owner", "old-owner-password-2026"), error => error.status === 401);
    assert.ok(findSession(db, createSession(db).token));
  } finally { db.close(); }
});

test("a failed new password leaves the old password and sessions usable", async () => {
  const db = createDatabase(":memory:");
  try {
    await createOwner(db, { name: "Shop Owner", email: "owner", password: "old-owner-password-2026" });
    const session = createSession(db);
    await assert.rejects(() => changeOwnerPassword(db, "owner", "old-owner-password-2026", "short"), error => error.status === 400);
    assert.ok(findSession(db, session.token));
    assert.equal((await authenticateOwner(db, "owner", "old-owner-password-2026")).email, "owner");
  } finally { db.close(); }
});

test("a completely archived catalogue still has a valid empty public snapshot", () => {
  const db = createDatabase(":memory:");
  try {
    for (const product of getCatalogue(db).products) archiveProduct(db, product.id, getCatalogue(db).revision);
    assert.deepEqual(getCatalogue(db).products, []);
    assert.equal(getCatalogue(db, true).products.length, 8);
    assert.equal(getCatalogue(db).revision, 9);
  } finally { db.close(); }
});

test("consistent backups contain WAL commits, owner login and photos and can be restored", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sagar-backup-test-"));
  const source = join(directory, "shop.sqlite");
  const target = join(directory, "backup.sqlite");
  const db = createDatabase(source);
  try {
    await createOwner(db, { name: "Shop Owner", email: "owner", password: "long-owner-password-2026" });
    updateProduct(db, "catla", { pricePerKg: 377 }, getCatalogue(db).revision);
    db.prepare("INSERT INTO media VALUES (?, ?, ?)").run("test-media", Buffer.from("photo-bytes"), "image/webp");
    backupDatabase(source, target);
    assert.equal(statSync(target).mode & 0o777, 0o600);
    const restored = createDatabase(target);
    try {
      assert.equal(getCatalogue(restored).products.find(product => product.id === "catla").pricePerKg, 377);
      assert.equal((await authenticateOwner(restored, "owner", "long-owner-password-2026")).email, "owner");
      assert.deepEqual(Buffer.from(restored.prepare("SELECT data FROM media WHERE id = ?").get("test-media").data), Buffer.from("photo-bytes"));
    } finally { restored.close(); }
    assert.throws(() => backupDatabase(source, target), /never overwritten/);
    assert.throws(() => backupDatabase(source, source), /never overwritten/);
    assert.throws(() => backupDatabase(source, join(process.cwd(), "public", "unsafe-backup.sqlite")), /public assets/);
  } finally { db.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("backup retention preserves unrelated files and keeps only verified helper snapshots", () => {
  const directory = mkdtempSync(join(tmpdir(), "sagar-retention-test-"));
  const source = join(directory, "shop.sqlite");
  createDatabase(source).close();
  const backups = join(directory, "backups");
  try {
    for (let index = 0; index < 4; index++) createRotatingBackup(source, backups, 2);
    writeFileSync(join(backups, "manual-important-backup.sqlite"), "keep me");
    createRotatingBackup(source, backups, 2);
    const files = readdirSync(backups);
    assert.equal(files.length, 3);
    assert.ok(files.includes("manual-important-backup.sqlite"));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("production refuses ephemeral, public, temporary and unconfigured storage", () => {
  const base = { NEXT_PUBLIC_SITE_URL: "https://sagar-live-fish.shop", SAGAR_DATABASE_PATH: "/var/data/sagar.sqlite" };
  assert.equal(productionConfig(base).port, 3000);
  for (const patch of [{ SAGAR_DATABASE_PATH: undefined }, { SAGAR_DATABASE_PATH: ".data/shop.sqlite" }, { SAGAR_DATABASE_PATH: "/tmp/shop.sqlite" }, { SAGAR_DATABASE_PATH: `${process.cwd()}/public/shop.sqlite` }, { VERCEL: "1" }, { PORT: "invalid" }])
    assert.throws(() => productionConfig({ ...base, ...patch }));
});

test("website QR requires a permanent HTTPS origin and includes a quiet zone", () => {
  for (const invalid of [undefined, "http://127.0.0.1:3000", "https://your-domain.example", "https://example.com", "https://shop.test", "https://localhost", "https://10.0.0.1", "https://shop.com/path", "https://shop.com?private=token", "https://user:secret@shop.com"])
    assert.throws(() => publicSiteOrigin(invalid));
  const svg = websiteQrSvg("https://sagar-live-fish.shop/");
  assert.match(svg, /<svg/);
  assert.match(svg, /fill="#fff"/);
  assert.match(svg, /shape-rendering="crispEdges"/);
  const commands = [...svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)];
  assert.ok(commands.length > 100);
  for (const command of commands) assert.ok(Number(command[1]) >= 4 && Number(command[2]) >= 4);
  const poster = shopQrPoster("https://sagar-live-fish.shop", "data:image/png;base64,AA==");
  assert.match(poster, /size:A4/);
  assert.match(poster, /sagar-live-fish\.shop/);
  assert.match(poster, /530046/);
});

test("map links preserve the owner's exact shop coordinates and PIN", () => {
  assert.equal(SHOP_DETAILS.location.latitude, 17.694756);
  assert.equal(SHOP_DETAILS.location.longitude, 83.172180);
  assert.equal(new URL(SHOP_DETAILS.location.directionsUrl).searchParams.get("destination"), "17.694756,83.172180");
  assert.match(SHOP_DETAILS.address.en, /Gandhi Bomma Centre/);
  assert.match(SHOP_DETAILS.address.en, /530046/);
});

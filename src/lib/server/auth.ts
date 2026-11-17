import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { OwnerIdentity } from "../../types/admin.ts";
import { HttpError } from "./errors.ts";

export const SESSION_COOKIE = "sagar_owner_session";
export const LOGIN_CLIENT_COOKIE = "sagar_signin_client";
let activePasswordChecks = 0;
export const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
const SCRYPT_N = 131072;
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: SCRYPT_N, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function normaliseOwnerLogin(value: unknown) {
  if (typeof value !== "string" || value.length > 254)
    throw new HttpError(400, "Enter an email address or a username of 3–64 characters.");
  const login = value.trim().toLowerCase();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login) &&
    !/^[a-z][a-z0-9._-]{2,63}$/.test(login)
  )
    throw new HttpError(400, "Enter an email address or a username of 3–64 characters.");
  return login;
}

export async function hashPassword(password: string) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    throw new HttpError(
      400,
      "Choose a password between 12 and 128 characters.",
    );
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  if (
    typeof password !== "string" ||
    password.length > 128 ||
    !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash)
  )
    return false;
  const [, salt, expected] = hash.split("$");
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}
export function getOwner(db: DatabaseSync): OwnerIdentity | null {
  const owner = db
    .prepare("SELECT name, email FROM owner WHERE id = 1")
    .get() as OwnerIdentity | undefined;
  return owner ? { name: owner.name, email: owner.email } : null;
}
export async function createOwner(
  db: DatabaseSync,
  input: { name: string; email: string; password: string },
): Promise<OwnerIdentity> {
  if (getOwner(db))
    throw new HttpError(
      409,
      "The owner account is already set up. Sign in instead.",
    );
  if (
    typeof input.name !== "string" ||
    input.name.trim().length < 2 ||
    input.name.trim().length > 120
  )
    throw new HttpError(
      400,
      "Enter an owner name between 2 and 120 characters.",
    );
  const login = normaliseOwnerLogin(input.email);
  const passwordHash = await hashPassword(input.password);
  const owner = {
    name: input.name.trim(),
    // Retain the existing column/API for compatible email and username sign-in.
    email: login,
  };
  // The fixed primary key also prevents two concurrent setup requests claiming ownership.
  try {
    db.prepare(
      "INSERT INTO owner (id, name, email, password_hash) VALUES (1, ?, ?, ?)",
    ).run(owner.name, owner.email, passwordHash);
  } catch (error) {
    if (getOwner(db))
      throw new HttpError(
        409,
        "The owner account is already set up. Sign in instead.",
      );
    throw error;
  }
  return owner;
}
export function consumeLoginAttempt(
  db: DatabaseSync,
  now = Date.now(),
  client = "anonymous",
) {
  const clientKey = tokenHash(client);
  const windowMs = 15 * 60 * 1000;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM login_attempts WHERE started_at < ?").run(
      now - windowMs,
    );
    const row = db
      .prepare(
        "SELECT attempts, started_at FROM login_attempts WHERE client_key = ?",
      )
      .get(clientKey) as { attempts: number; started_at: number } | undefined;
    if (!row || row.started_at + windowMs <= now)
      db.prepare(
        "INSERT INTO login_attempts (client_key, attempts, started_at) VALUES (?, 1, ?) ON CONFLICT(client_key) DO UPDATE SET attempts = 1, started_at = excluded.started_at",
      ).run(clientKey, now);
    else {
      if (row.attempts >= 10)
        throw new HttpError(
          429,
          "Too many sign-in attempts. Please try again in 15 minutes.",
        );
      db.prepare(
        "UPDATE login_attempts SET attempts = attempts + 1 WHERE client_key = ?",
      ).run(clientKey);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export async function authenticateOwner(
  db: DatabaseSync,
  email: string,
  password: string,
  client = "anonymous",
): Promise<OwnerIdentity> {
  consumeGlobalLoginBudget(db);
  consumeLoginAttempt(db, Date.now(), client);
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 254 ||
    password.length > 128
  )
    throw new HttpError(401, "Email or password is incorrect.");
  const owner = db
    .prepare("SELECT name, email, password_hash FROM owner WHERE id = 1")
    .get() as (OwnerIdentity & { password_hash: string }) | undefined;
  if (!owner) throw new HttpError(401, "Email or password is incorrect.");
  if (activePasswordChecks >= 2)
    throw new HttpError(429, "Sign-in is busy. Please try again in a moment.");
  activePasswordChecks++;
  let passwordMatches: boolean;
  try {
    passwordMatches = await verifyPassword(password, owner.password_hash);
  } finally {
    activePasswordChecks--;
  }
  if (!passwordMatches || owner.email !== email.trim().toLowerCase())
    throw new HttpError(401, "Email or password is incorrect.");
  db.prepare("DELETE FROM login_attempts WHERE client_key = ?").run(
    tokenHash(client),
  );
  return { name: owner.name, email: owner.email };
}

export function consumeGlobalLoginBudget(db: DatabaseSync, now = Date.now()) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const previous = db
      .prepare("SELECT tokens, updated_at FROM login_budget WHERE id = 1")
      .get() as { tokens: number; updated_at: number } | undefined;
    const tokens = previous
      ? Math.min(
          5,
          previous.tokens + Math.max(0, now - previous.updated_at) / 1000,
        )
      : 5;
    if (tokens < 1)
      throw new HttpError(
        429,
        "Sign-in is busy. Please try again in a moment.",
      );
    db.prepare(
      "INSERT INTO login_budget (id, tokens, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET tokens = excluded.tokens, updated_at = excluded.updated_at",
    ).run(tokens - 1, now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export function createSession(db: DatabaseSync, now = Date.now()) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = now + SESSION_LIFETIME_MS;
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  db.prepare(
    "DELETE FROM sessions WHERE token_hash NOT IN (SELECT token_hash FROM sessions ORDER BY expires_at DESC LIMIT 7)",
  ).run();
  db.prepare(
    "INSERT INTO sessions (token_hash, owner_id, expires_at) VALUES (?, 1, ?)",
  ).run(tokenHash(token), expiresAt);
  return { token, expiresAt };
}
export function findSession(
  db: DatabaseSync,
  token: string | undefined,
  now = Date.now(),
): OwnerIdentity | null {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const owner = db
      .prepare(
        "SELECT owner.name, owner.email FROM sessions JOIN owner ON owner.id = sessions.owner_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
      )
      .get(tokenHash(token), now) as OwnerIdentity | undefined;
  return owner ? { name: owner.name, email: owner.email } : null;
}
export function revokeSession(db: DatabaseSync, token: string | undefined) {
  if (token && /^[a-f0-9]{64}$/.test(token))
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
      tokenHash(token),
    );
}

export async function changeOwnerPassword(
  db: DatabaseSync,
  login: string,
  currentPassword: string,
  newPassword: string,
  client = "anonymous",
) {
  const previous = db.prepare("SELECT password_hash FROM owner WHERE id = 1").get() as
    | { password_hash: string }
    | undefined;
  const owner = await authenticateOwner(db, login, currentPassword, client);
  if (currentPassword === newPassword)
    throw new HttpError(400, "Choose a different new password.");
  const hash = await hashPassword(newPassword);
  db.exec("BEGIN IMMEDIATE");
  try {
    const changed = db.prepare(
      "UPDATE owner SET password_hash = ? WHERE id = 1 AND password_hash = ?",
    ).run(hash, previous!.password_hash);
    if (!changed.changes)
      throw new HttpError(409, "The password changed on another device. Sign in again.");
    db.exec("DELETE FROM sessions");
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return owner;
}

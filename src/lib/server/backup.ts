import { DatabaseSync } from "node:sqlite";
import { chmodSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join, resolve, relative, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";

export function backupDatabase(source: string, destination: string) {
  const publicRelative = relative(resolve("public"), resolve(destination));
  if (publicRelative === "" || (!publicRelative.startsWith("..") && !isAbsolute(publicRelative)))
    throw new Error("Private database backups cannot be written into public assets.");
  if (resolve(source) === resolve(destination) || existsSync(destination))
    throw new Error("Choose a new backup filename; existing files are never overwritten.");
  mkdirSync(dirname(destination), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(source, { readOnly: true });
  try {
    // VACUUM INTO produces a consistent snapshot including committed WAL data.
    db.prepare("VACUUM INTO ?").run(destination);
    chmodSync(destination, 0o600);
  } finally {
    db.close();
  }
  const copy = new DatabaseSync(destination, { readOnly: true });
  try {
    const check = copy.prepare("PRAGMA quick_check").get() as { quick_check: string };
    if (check.quick_check !== "ok") throw new Error("Backup integrity check failed.");
  } finally {
    copy.close();
  }
  return destination;
}

export function createRotatingBackup(source: string, directory = join(dirname(source), "backups"), keep = 7) {
  if (!Number.isSafeInteger(keep) || keep < 2 || keep > 30)
    throw new Error("Retain between 2 and 30 verified backups.");
  const name = `sagar-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}.sqlite`;
  const path = backupDatabase(source, join(directory, name));
  // Only this helper's own backup filenames are eligible for retention cleanup.
  const backups = readdirSync(directory).filter(file => file !== name && /^sagar-\d{4}-\d\d-\d\dT[\dZ-]+-[a-f0-9]{8}\.sqlite$/.test(file)).sort().reverse();
  for (const file of backups.slice(keep - 1)) unlinkSync(join(directory, file));
  return path;
}

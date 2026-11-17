import { resolve } from "node:path";
import nextEnv from "@next/env";
import { createRotatingBackup, backupDatabase } from "../src/lib/server/backup.ts";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const source = process.env.SAGAR_DATABASE_PATH || resolve(".data/sagar.sqlite");
const destination = process.argv[2];
const path = destination ? backupDatabase(source, resolve(destination)) : createRotatingBackup(source, process.env.SAGAR_BACKUP_DIR);
console.log(`Verified private backup: ${path}`);

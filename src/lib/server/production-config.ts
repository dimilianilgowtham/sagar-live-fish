import { isAbsolute, relative, resolve } from "node:path";

export function publicSiteOrigin(value: string | undefined) {
  if (!value) throw new Error("Set NEXT_PUBLIC_SITE_URL to the permanent HTTPS website address.");
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" || url.username || url.password ||
    url.pathname !== "/" || url.search || url.hash || url.port ||
    !host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":") ||
    /(?:^|\.)(?:localhost|local|test|invalid|example)$/.test(host) ||
    /^(?:.+\.)?example\.(?:com|org|net)$/.test(host)
  ) throw new Error("Use a permanent public HTTPS origin, without a path, port or tracking parameters.");
  return url.origin;
}

export function productionConfig(env: NodeJS.ProcessEnv, cwd = process.cwd()) {
  const siteUrl = publicSiteOrigin(env.NEXT_PUBLIC_SITE_URL);
  const databasePath = env.SAGAR_DATABASE_PATH;
  if (!databasePath || !isAbsolute(databasePath) || databasePath === ":memory:")
    throw new Error("Set SAGAR_DATABASE_PATH to an absolute file on a private persistent disk.");
  const publicRelative = relative(resolve(cwd, "public"), resolve(databasePath));
  if (publicRelative === "" || (!publicRelative.startsWith("..") && !isAbsolute(publicRelative)))
    throw new Error("The database must never be stored in the public directory.");
  if (/^\/(?:private\/)?(?:tmp|var\/tmp)(?:\/|$)/.test(databasePath))
    throw new Error("Temporary directories are not durable database storage.");
  if (env.VERCEL || env.NETLIFY)
    throw new Error("This SQLite build requires a Node server with a persistent disk, not an ephemeral function.");
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be a number from 1 to 65535.");
  return { siteUrl, databasePath, port };
}

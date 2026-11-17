import { HttpError } from "./errors.ts";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  let matches = false;
  try {
    const parsed = new URL(origin ?? "");
    const host = request.headers.get("host") || new URL(request.url).host;
    matches =
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.origin === origin &&
      new URL(`${parsed.protocol}//${host}`).origin === origin;
  } catch {
    /* Invalid or missing origins fail closed. */
  }
  if (!matches || fetchSite === "cross-site")
    throw new HttpError(
      403,
      "This request must come from your own Sagar website. Refresh and try again.",
    );
}
export function isLocalSetupAllowed(
  host: string | null,
  environment = process.env.NODE_ENV,
) {
  if (environment !== "development" || !host) return false;
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(`http://${host}`).hostname,
    );
  } catch {
    return false;
  }
}
export function expectedRevision(request: Request) {
  const value = request.headers.get("if-match");
  if (!value || !/^[1-9]\d*$/.test(value))
    throw new HttpError(400, "Refresh the catalogue before saving.");
  const revision = Number(value);
  if (!Number.isSafeInteger(revision))
    throw new HttpError(400, "Refresh the catalogue before saving.");
  return revision;
}
export async function readJson(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(415, "Send product details as JSON.");
  if (Number(request.headers.get("content-length") || 0) > 65536)
    throw new HttpError(413, "This request is too large.");
  const body = (await readBoundedBody(request, 65536)).toString("utf8");
  try {
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "The submitted details could not be read.");
  }
}

export async function readBoundedBody(request: Request, limit: number) {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new HttpError(413, "This request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new HttpError(413, "This request is too large.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

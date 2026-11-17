import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { database } from "./database.ts";
import { findSession, SESSION_COOKIE, SESSION_LIFETIME_MS } from "./auth.ts";
import { HttpError } from "./errors.ts";
import { assertSameOrigin } from "./request-security.ts";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function api(work: () => Promise<Response> | Response) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    console.error(
      "Sagar request failed:",
      error instanceof Error ? error.message : "Unexpected error",
    );
    return json(
      { error: "We couldn’t save that change. Please try again." },
      500,
    );
  }
}
export async function currentOwner() {
  const jar = await cookies();
  return findSession(database(), jar.get(SESSION_COOKIE)?.value);
}
export async function requireOwner(request: Request) {
  if (request.method !== "GET") assertSameOrigin(request);
  const owner = await currentOwner();
  if (!owner)
    throw new HttpError(401, "Please sign in to manage the catalogue.");
  return owner;
}
export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_LIFETIME_MS / 1000,
  });
  return response;
}

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  authenticateOwner,
  createSession,
  LOGIN_CLIENT_COOKIE,
} from "@/lib/server/auth";
import { database } from "@/lib/server/database";
import { api, json, setSessionCookie } from "@/lib/server/http";
import { assertSameOrigin, readJson } from "@/lib/server/request-security";

export async function GET() {
  const existing = (await cookies()).get(LOGIN_CLIENT_COOKIE)?.value;
  const token =
    existing && /^[a-f0-9]{64}$/.test(existing)
      ? existing
      : randomBytes(32).toString("hex");
  const response = json({ ok: true });
  response.cookies.set(LOGIN_CLIENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
export async function POST(request: Request) {
  return api(async () => {
    assertSameOrigin(request);
    const body = await readJson(request);
    const db = database();
    const client = (await cookies()).get(LOGIN_CLIENT_COOKIE)?.value;
    const owner = await authenticateOwner(
      db,
      body.email as string,
      body.password as string,
      client && /^[a-f0-9]{64}$/.test(client) ? client : "anonymous",
    );
    return setSessionCookie(json({ owner }), createSession(db).token);
  });
}

import { cookies } from "next/headers";
import { changeOwnerPassword, createSession, LOGIN_CLIENT_COOKIE } from "@/lib/server/auth";
import { database } from "@/lib/server/database";
import { api, json, requireOwner, setSessionCookie } from "@/lib/server/http";
import { readJson } from "@/lib/server/request-security";

export async function POST(request: Request) {
  return api(async () => {
    const owner = await requireOwner(request);
    const body = await readJson(request);
    const client = (await cookies()).get(LOGIN_CLIENT_COOKIE)?.value;
    const db = database();
    await changeOwnerPassword(
      db, owner.email,
      body.currentPassword as string,
      body.newPassword as string,
      client && /^[a-f0-9]{64}$/.test(client) ? client : "anonymous",
    );
    return setSessionCookie(json({ ok: true }), createSession(db).token);
  });
}

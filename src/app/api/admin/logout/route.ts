import { cookies } from "next/headers";
import { revokeSession, SESSION_COOKIE } from "@/lib/server/auth";
import { database } from "@/lib/server/database";
import { api, json } from "@/lib/server/http";
import { assertSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request) {
  return api(async () => {
    assertSameOrigin(request);
    revokeSession(database(), (await cookies()).get(SESSION_COOKIE)?.value);
    const response = json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  });
}

import {
  consumeLoginAttempt,
  createOwner,
  createSession,
} from "@/lib/server/auth";
import { database } from "@/lib/server/database";
import { HttpError } from "@/lib/server/errors";
import { api, json, setSessionCookie } from "@/lib/server/http";
import {
  assertSameOrigin,
  isLocalSetupAllowed,
  readJson,
} from "@/lib/server/request-security";

export async function POST(request: Request) {
  return api(async () => {
    assertSameOrigin(request);
    if (!isLocalSetupAllowed(request.headers.get("host")))
      throw new HttpError(
        403,
        "Set up the owner account on this computer before publishing the website.",
      );
    const body = await readJson(request);
    const db = database();
    consumeLoginAttempt(db);
    const owner = await createOwner(db, {
      name: body.name as string,
      email: body.email as string,
      password: body.password as string,
    });
    return setSessionCookie(json({ owner }, 201), createSession(db).token);
  });
}

import { connection } from "next/server";
import { database } from "@/lib/server/database";
import { getCatalogueHistory } from "@/lib/server/catalogue";
import { HttpError } from "@/lib/server/errors";
import { api, json, requireOwner } from "@/lib/server/http";

export async function GET(request: Request) {
  // Let Next stop prerendering before the application error handler runs.
  await connection();
  return api(async () => {
    await requireOwner(request);
    const params = new URL(request.url).searchParams;
    const pageSize = params.get("limit");
    if (
      params.getAll("cursor").length > 1 ||
      params.getAll("limit").length > 1 ||
      (pageSize !== null && !/^[1-9]\d{0,2}$/.test(pageSize))
    ) {
      throw new HttpError(400, "Choose a valid history page.");
    }
    return json(
      getCatalogueHistory(database(), {
        cursor: params.get("cursor"),
        limit: pageSize === null ? undefined : Number(pageSize),
      }),
    );
  });
}

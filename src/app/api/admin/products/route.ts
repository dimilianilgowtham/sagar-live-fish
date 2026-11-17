import { database } from "@/lib/server/database";
import { createProduct, getCatalogue } from "@/lib/server/catalogue";
import { api, json, requireOwner } from "@/lib/server/http";
import { expectedRevision, readJson } from "@/lib/server/request-security";

export async function GET(request: Request) {
  return api(async () => {
    await requireOwner(request);
    return json(getCatalogue(database(), true));
  });
}
export async function POST(request: Request) {
  return api(async () => {
    const owner = await requireOwner(request);
    return json(
      createProduct(
        database(),
        await readJson(request),
        expectedRevision(request),
        owner,
      ),
      201,
    );
  });
}

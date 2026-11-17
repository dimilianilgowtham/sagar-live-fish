import { database } from "@/lib/server/database";
import { bulkAvailability } from "@/lib/server/catalogue";
import { api, json, requireOwner } from "@/lib/server/http";
import { expectedRevision, readJson } from "@/lib/server/request-security";

export async function POST(request: Request) {
  return api(async () => {
    const owner = await requireOwner(request);
    const body = await readJson(request);
    return json(
      bulkAvailability(
        database(),
        body.available as boolean,
        expectedRevision(request),
        owner,
      ),
    );
  });
}

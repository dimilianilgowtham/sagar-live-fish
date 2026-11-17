import { database } from "@/lib/server/database";
import { archiveProduct, updateProduct } from "@/lib/server/catalogue";
import { api, json, requireOwner } from "@/lib/server/http";
import { expectedRevision, readJson } from "@/lib/server/request-security";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return api(async () => {
    const owner = await requireOwner(request);
    const { id } = await context.params;
    return json(
      updateProduct(
        database(),
        id,
        await readJson(request),
        expectedRevision(request),
        owner,
      ),
    );
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(async () => {
    const owner = await requireOwner(request);
    const { id } = await context.params;
    return json(archiveProduct(database(), id, expectedRevision(request), owner));
  });
}

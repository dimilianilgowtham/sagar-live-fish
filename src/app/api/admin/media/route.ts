import { database } from "@/lib/server/database";
import { HttpError } from "@/lib/server/errors";
import { api, json, requireOwner } from "@/lib/server/http";
import { MAX_IMAGE_BYTES, storeImage } from "@/lib/server/media";
import { readBoundedBody } from "@/lib/server/request-security";

export async function POST(request: Request) {
  return api(async () => {
    await requireOwner(request);
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data"))
      throw new HttpError(400, "Choose a photo to upload.");
    const bytes = await readBoundedBody(request, MAX_IMAGE_BYTES + 65536);
    let form: FormData;
    try {
      form = await new Request(request.url, {
        method: "POST",
        headers: { "content-type": contentType },
        body: Uint8Array.from(bytes),
      }).formData();
    } catch {
      throw new HttpError(400, "The photo upload could not be read.");
    }
    const file = form.get("file");
    if (!(file instanceof File))
      throw new HttpError(400, "Choose a photo to upload.");
    return json(await storeImage(database(), file), 201);
  });
}

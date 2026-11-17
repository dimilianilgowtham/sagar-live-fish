import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import sharp from "sharp";
import { HttpError } from "./errors.ts";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export async function storeImage(db: DatabaseSync, file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size < 1 ||
    file.size > MAX_IMAGE_BYTES
  )
    throw new HttpError(
      400,
      "Upload a JPEG, PNG or WebP photo no larger than 5 MB.",
    );
  let data: Buffer;
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20000000,
      animated: false,
    });
    const metadata = await input.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error("Unsupported photo");
    data = await input
      .rotate()
      .resize({
        width: 1800,
        height: 1800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .timeout({ seconds: 10 })
      .toBuffer();
  } catch {
    throw new HttpError(
      400,
      "That file could not be read as a photo. Please choose a JPEG, PNG or WebP.",
    );
  }
  const id = randomUUID();
  db.prepare("INSERT INTO media (id, data, content_type) VALUES (?, ?, ?)").run(
    id,
    data,
    "image/webp",
  );
  return { image: `/api/media/${id}` };
}
export function getImage(db: DatabaseSync, id: string) {
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      id,
    )
  )
    throw new HttpError(404, "Photo not found.");
  const row = db
    .prepare("SELECT data, content_type FROM media WHERE id = ?")
    .get(id) as { data: Uint8Array; content_type: string } | undefined;
  if (!row) throw new HttpError(404, "Photo not found.");
  return { data: row.data, contentType: row.content_type };
}

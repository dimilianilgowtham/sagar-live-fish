import { connection } from "next/server";
import { database } from "@/lib/server/database";
import { getImage } from "@/lib/server/media";
import { api } from "@/lib/server/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  return api(async () => {
    const { id } = await context.params;
    const image = getImage(database(), id);
    return new Response(Uint8Array.from(image.data), {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  });
}

import { connection } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { api, requireOwner } from "@/lib/server/http";
import { HttpError } from "@/lib/server/errors";
import { publicSiteOrigin } from "@/lib/server/production-config";
import { websiteQrSvg, shopQrPoster } from "@/lib/server/qr";

export async function GET(request: Request) {
  await connection();
  return api(async () => {
    await requireOwner(request);
    let origin: string;
    try { origin = publicSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL); }
    catch { throw new HttpError(409, "Publish the website and configure its permanent HTTPS address before printing its QR code."); }
    const format = new URL(request.url).searchParams.get("format") || "svg";
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
    if (format === "poster") {
      const logo = await readFile(join(process.cwd(), "public/images/sagar-logo.png"));
      return new Response(shopQrPoster(origin, `data:image/png;base64,${logo.toString("base64")}`), {
        headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const svg = websiteQrSvg(origin);
    if (format === "png") {
      const data = await sharp(Buffer.from(svg)).png().toBuffer();
      return new Response(new Uint8Array(data), { headers: {
        ...headers, "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="sagar-live-fish-website-qr.png"',
      } });
    }
    if (format !== "svg") throw new HttpError(400, "Choose SVG, PNG or the print poster.");
    return new Response(svg, { headers: {
      ...headers, "Content-Type": "image/svg+xml", "Content-Disposition": 'attachment; filename="sagar-live-fish-website-qr.svg"',
    } });
  });
}

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import sharp from "sharp";
import nextEnv from "@next/env";
import { websiteQrSvg, shopQrPoster } from "../src/lib/server/qr.ts";
import { publicSiteOrigin } from "../src/lib/server/production-config.ts";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const origin = publicSiteOrigin(process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL);
const directory = resolve(process.argv[3] || "release/qr");
const svg = websiteQrSvg(origin);
mkdirSync(directory, { recursive: true });
writeFileSync(join(directory, "sagar-live-fish-website-qr.svg"), svg);
await sharp(Buffer.from(svg)).png().toFile(join(directory, "sagar-live-fish-website-qr.png"));
const logo = readFileSync(resolve("public/images/sagar-logo.png")).toString("base64");
writeFileSync(join(directory, "sagar-live-fish-print-poster.html"), shopQrPoster(origin, `data:image/png;base64,${logo}`));
console.log(`Generated website QR and self-contained A4 print poster for ${origin} in ${directory}`);

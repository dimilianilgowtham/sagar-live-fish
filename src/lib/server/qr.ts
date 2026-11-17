import QRCode from "../../../scripts/vendor/qr-code/index.js";
import { publicSiteOrigin } from "./production-config.ts";

export function websiteQrSvg(siteUrl: string) {
  const origin = publicSiteOrigin(siteUrl);
  const qr = new QRCode(-1, 0); // Automatic version, medium error correction.
  qr.addData(origin);
  qr.make();
  const count = qr.getModuleCount();
  const size = count + 8; // Four white modules on every side for reliable scanning.
  const cells: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) cells.push(`M${col + 4} ${row + 4}h1v1h-1z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * 32}" height="${size * 32}" shape-rendering="crispEdges"><title>Sagar Live Fish website QR</title><rect width="${size}" height="${size}" fill="#fff"/><path d="${cells.join("")}" fill="#051b40"/></svg>`;
}

export function shopQrPoster(siteUrl: string, logoDataUrl: string) {
  const origin = publicSiteOrigin(siteUrl);
  const label = origin.replace(/^https:\/\//, "");
  const qr = websiteQrSvg(origin);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sagar Live Fish — shop QR poster</title><style>
  *{box-sizing:border-box}body{margin:0;background:#e8f4fb;color:#082d62;font-family:Arial,sans-serif}.poster{width:min(100%,794px);min-height:1123px;margin:24px auto;background:#fff;text-align:center;padding:54px 48px;border-top:12px solid #082d62}.logo{display:block;width:min(100%,540px);height:auto;margin:0 auto 36px}h1{font-size:40px;line-height:1.15;margin:0 0 15px}p{line-height:1.6}.intro{font-size:20px;margin:0 auto 24px;max-width:520px}.qr{width:min(100%,430px);margin:20px auto}.qr svg{width:100%;height:auto;display:block}.url{font-size:20px;font-weight:bold;overflow-wrap:anywhere}.steps{font-size:18px;color:#41637b}.address{margin-top:40px;border-top:1px solid #c8dfed;padding-top:26px;font-size:16px}.print{display:block;margin:24px auto;padding:14px 24px;background:#082d62;color:#fff;border:0;border-radius:4px;cursor:pointer;font-size:16px}@page{size:A4;margin:0}@media print{body{background:#fff}.poster{width:210mm;min-height:297mm;margin:0;break-inside:avoid}.print{display:none}}@media(max-width:500px){.poster{padding:30px 22px;min-height:auto}h1{font-size:30px}.intro{font-size:17px}}
  </style></head><body><button class="print" onclick="window.print()">Print shop poster</button><main class="poster"><img class="logo" src="${logoDataUrl}" alt="Sagar Live Fish"><h1>Fresh catch.<br>Your next good meal.</h1><p class="intro">Scan to browse our fish, prawns and crabs, then enquire on WhatsApp.</p><div class="qr">${qr}</div><p class="url">${label}</p><p class="steps">Scan · Choose your catch · WhatsApp us</p><p class="address">Gandhi Bomma Centre, Vadlapudi<br>Visakhapatnam – 530046<br>Call / WhatsApp: +91 6305239969</p></main></body></html>`;
}

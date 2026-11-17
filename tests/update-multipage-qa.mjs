import { readFileSync } from "node:fs";
import { INITIAL_PRODUCTS } from "../src/data/products.ts";

const fixturePath = process.env.SAGAR_QA_FIXTURE || process.argv[3];
if (!fixturePath?.startsWith("/private/tmp/sagar-multipage-qa-"))
  throw new Error("Use a disposable QA fixture only.");
JSON.parse(readFileSync(fixturePath, "utf8"));
const updates = {
  cuts: { cuts: ["QA whole cleaned"] },
  soldout: { isAvailable: false },
  restore: {
    cuts: INITIAL_PRODUCTS[0].cuts,
    isAvailable: true,
    pricePerKg: 240,
  },
};
const update = updates[process.argv[2]];
if (!update) throw new Error("Choose cuts, soldout or restore.");
const origin = "http://localhost:3001";
const login = await fetch(`${origin}/api/admin/login`, {
  method: "POST",
  headers: { origin, "content-type": "application/json" },
  body: JSON.stringify({
    email: "qa@example.test",
    password: "sagar-qa-owner-2026",
  }),
});
if (!login.ok) throw new Error("QA sign-in failed.");
const cookie = login.headers.get("set-cookie").split(";")[0];
const catalogue = await (
  await fetch(`${origin}/api/admin/products`, { headers: { cookie } })
).json();
const response = await fetch(`${origin}/api/admin/products/catla`, {
  method: "PATCH",
  headers: {
    origin,
    cookie,
    "content-type": "application/json",
    "if-match": String(catalogue.revision),
  },
  body: JSON.stringify(update),
});
if (!response.ok) throw new Error(await response.text());
console.log(`Updated the disposable QA catalogue: ${process.argv[2]}.`);

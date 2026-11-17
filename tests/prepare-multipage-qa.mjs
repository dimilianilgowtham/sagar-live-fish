import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createDatabase } from "../src/lib/server/database.ts";
import { createOwner } from "../src/lib/server/auth.ts";
import {
  createProduct,
  updateProduct,
  archiveProduct,
  getCatalogue,
} from "../src/lib/server/catalogue.ts";
import { INITIAL_PRODUCTS } from "../src/data/products.ts";

// Always creates a disposable database; never opens the shop's configured path.
const directory = mkdtempSync("/private/tmp/sagar-multipage-qa-");
const databasePath = join(directory, "qa.sqlite");
const db = createDatabase(databasePath);
const actor = { name: "QA Owner", email: "qa@example.test" };
await createOwner(db, { ...actor, password: "sagar-qa-owner-2026" });
let snapshot = getCatalogue(db, true);
let customId;
for (let index = 0; index < 21; index++) {
  const base = INITIAL_PRODUCTS[index % INITIAL_PRODUCTS.length];
  snapshot = createProduct(
    db,
    {
      ...base,
      nameEn: `QA Fish ${String(index + 1).padStart(2, "0")}`,
      nameTe: `పరీక్ష చేప ${index + 1}`,
      image: `/images/${base.id}.webp`,
      pricePerKg: 200 + index * 10,
      isAvailable: index % 5 !== 0,
    },
    snapshot.revision,
    actor,
  );
  customId ??= snapshot.products.at(-1).id;
}
snapshot = createProduct(
  db,
  {
    ...INITIAL_PRODUCTS[0],
    nameEn: "Archived QA Fish",
    image: "/images/catla.webp",
  },
  snapshot.revision,
  actor,
);
const archivedId = snapshot.products.at(-1).id;
snapshot = archiveProduct(db, archivedId, snapshot.revision, actor);
snapshot = updateProduct(
  db,
  "tuna",
  { isAvailable: false },
  snapshot.revision,
  actor,
);
for (let index = 0; index < 30; index++) {
  snapshot = updateProduct(
    db,
    "catla",
    { pricePerKg: index % 2 ? 240 : 250 },
    snapshot.revision,
    actor,
  );
}
const fixture = {
  directory,
  databasePath,
  archivedId,
  customId,
  activeCount: getCatalogue(db).products.length,
};
writeFileSync(join(directory, "fixture.json"), JSON.stringify(fixture), {
  mode: 0o600,
});
db.close();
process.stdout.write(JSON.stringify(fixture));

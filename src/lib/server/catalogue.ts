import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  AdminCatalogue,
  CatalogueSnapshot,
  CatalogueFieldChange,
  CatalogueHistoryAction,
  CatalogueHistoryPage,
  ManagedProduct,
  OwnerIdentity,
} from "../../types/admin.ts";
import { HttpError } from "./errors.ts";
import { validateProduct } from "./validation.ts";

type ProductRow = {
  id: string;
  data: string;
  archived: number;
  sort_order: number;
};

// Explicit fields keep submitted credentials or unknown properties out of the log.
const historyFields = [
  "nameEn",
  "nameTe",
  "category",
  "icon",
  "descEn",
  "descTe",
  "pricePerKg",
  "isAvailable",
  "badge",
  "cuts",
  "image",
  "archived",
] as const;

function productChanges(
  before: ManagedProduct | null,
  after: ManagedProduct,
): CatalogueFieldChange[] {
  return historyFields.flatMap((field) => {
    const previous = before?.[field] ?? null;
    const next = after[field] ?? null;
    return before && JSON.stringify(previous) === JSON.stringify(next)
      ? []
      : [{ field, before: previous, after: next }];
  });
}

function recordHistory(
  db: DatabaseSync,
  product: ManagedProduct,
  action: CatalogueHistoryAction,
  changes: CatalogueFieldChange[],
  actor?: OwnerIdentity,
) {
  db.prepare(`INSERT INTO catalogue_history
    (product_id, product_name, action, actor_name, actor_email, occurred_at, changes)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    product.id,
    product.nameEn,
    action,
    actor?.name ?? null,
    actor?.email ?? null,
    new Date().toISOString(),
    JSON.stringify(changes),
  );
}

export function getCatalogueHistory(
  db: DatabaseSync,
  options: { cursor?: string | null; limit?: number } = {},
): CatalogueHistoryPage {
  const limit = options.limit ?? 25;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw new HttpError(400, "Choose a history page size from 1 to 100.");
  const cursor = options.cursor;
  if (
    cursor !== undefined &&
    cursor !== null &&
    (typeof cursor !== "string" ||
      !/^[1-9]\d{0,15}$/.test(cursor) ||
      !Number.isSafeInteger(Number(cursor)))
  )
    throw new HttpError(400, "Choose a valid history page.");
  type HistoryRow = {
    id: number;
    product_id: string;
    product_name: string;
    action: CatalogueHistoryAction;
    actor_name: string | null;
    actor_email: string | null;
    occurred_at: string;
    changes: string;
  };
  const rows = (cursor
    ? db
        .prepare("SELECT * FROM catalogue_history WHERE id < ? ORDER BY id DESC LIMIT ?")
        .all(Number(cursor), limit + 1)
    : db
        .prepare("SELECT * FROM catalogue_history ORDER BY id DESC LIMIT ?")
        .all(limit + 1)) as HistoryRow[];
  const entries = rows.slice(0, limit).map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    action: row.action,
    actor:
      row.actor_name !== null && row.actor_email !== null
        ? { name: row.actor_name, email: row.actor_email }
        : null,
    occurredAt: row.occurred_at,
    changes: JSON.parse(row.changes) as CatalogueFieldChange[],
  }));
  return {
    entries,
    nextCursor:
      rows.length > limit ? String(entries[entries.length - 1].id) : null,
  };
}
export function getCatalogue(
  db: DatabaseSync,
  includeArchived?: false,
): CatalogueSnapshot;
export function getCatalogue(
  db: DatabaseSync,
  includeArchived: true,
): AdminCatalogue;
export function getCatalogue(
  db: DatabaseSync,
  includeArchived = false,
): CatalogueSnapshot | AdminCatalogue {
  // One statement keeps prices, availability and revision in the same SQLite
  // read snapshot, including when another connection commits an owner edit.
  const rows = db
    .prepare(
      `SELECT catalogue_state.revision, catalogue_state.updated_at, products.*
       FROM catalogue_state LEFT JOIN products ON ${includeArchived ? "1 = 1" : "products.archived = 0"}
       WHERE catalogue_state.id = 1 ORDER BY products.sort_order, products.id`,
    )
    .all() as (ProductRow & { revision: number; updated_at: string })[];
  const state = rows[0];
  if (!state) throw new HttpError(503, "The catalogue is temporarily unavailable. Please try again.");
  return {
    products: rows.filter(row => row.id !== null).map((row) =>
      includeArchived
        ? ({
            ...JSON.parse(row.data),
            archived: !!row.archived,
          } as ManagedProduct)
        : JSON.parse(row.data),
    ),
    revision: state.revision,
    updatedAt: state.updated_at,
  };
}
function write(
  db: DatabaseSync,
  revision: number,
  action: () => boolean,
): AdminCatalogue {
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw new HttpError(400, "Refresh the catalogue before saving.");
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = db
      .prepare("SELECT revision FROM catalogue_state WHERE id = 1")
      .get() as { revision: number };
    if (current.revision !== revision)
      throw new HttpError(
        409,
        "The catalogue changed on another device. Your draft is kept; review the latest catch and save again.",
      );
    if (action()) {
      db.prepare(
        "UPDATE catalogue_state SET revision = revision + 1, updated_at = ? WHERE id = 1",
      ).run(new Date().toISOString());
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return getCatalogue(db, true);
}
export function createProduct(
  db: DatabaseSync,
  input: unknown,
  revision: number,
  actor?: OwnerIdentity,
) {
  const product = validateProduct(input);
  product.id = `catch-${randomUUID().slice(0, 8)}`;
  return write(db, revision, () => {
    if (
      product.image?.startsWith("/api/media/") &&
      !db
        .prepare("SELECT id FROM media WHERE id = ?")
        .get(product.image.split("/").pop()!)
    )
      throw new HttpError(
        400,
        "The uploaded photo is missing. Upload it again.",
      );
    db.prepare(
      "INSERT INTO products (id, data, archived, sort_order) VALUES (?, ?, 0, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM products))",
    ).run(product.id, JSON.stringify(product));
    const managed = { ...product, archived: false };
    recordHistory(db, managed, "create", productChanges(null, managed), actor);
    return true;
  });
}
export function updateProduct(
  db: DatabaseSync,
  id: string,
  input: unknown,
  revision: number,
  actor?: OwnerIdentity,
) {
  return write(db, revision, () => {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
      | ProductRow
      | undefined;
    if (!row) throw new HttpError(404, "This product could not be found.");
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new HttpError(400, "Provide a valid product update.");
    const changes = input as Record<string, unknown>;
    if ("archived" in changes && typeof changes.archived !== "boolean")
      throw new HttpError(400, "Choose a valid archive status.");
    const before = {
      ...JSON.parse(row.data),
      archived: !!row.archived,
    } as ManagedProduct;
    const product = validateProduct(input, before);
    if (
      product.image?.startsWith("/api/media/") &&
      !db
        .prepare("SELECT id FROM media WHERE id = ?")
        .get(product.image.split("/").pop()!)
    )
      throw new HttpError(
        400,
        "The uploaded photo is missing. Upload it again.",
      );
    const after = {
      ...product,
      archived:
        typeof changes.archived === "boolean"
          ? changes.archived
          : before.archived,
    };
    const changed = productChanges(before, after);
    if (!changed.length) return false;
    db.prepare("UPDATE products SET data = ?, archived = ? WHERE id = ?").run(
      JSON.stringify(product),
      Number(after.archived),
      id,
    );
    const action =
      before.archived !== after.archived
        ? after.archived
          ? "archive"
          : "restore"
        : changed.length === 1 && changed[0].field === "isAvailable"
          ? "availability"
          : "update";
    recordHistory(db, after, action, changed, actor);
    return true;
  });
}
export function archiveProduct(
  db: DatabaseSync,
  id: string,
  revision: number,
  actor?: OwnerIdentity,
) {
  return updateProduct(db, id, { archived: true }, revision, actor);
}
export function bulkAvailability(
  db: DatabaseSync,
  available: boolean,
  revision: number,
  actor?: OwnerIdentity,
) {
  if (typeof available !== "boolean")
    throw new HttpError(400, "Choose a valid availability status.");
  return write(db, revision, () => {
    const rows = db
      .prepare("SELECT * FROM products WHERE archived = 0")
      .all() as ProductRow[];
    const update = db.prepare("UPDATE products SET data = ? WHERE id = ?");
    let changed = false;
    for (const row of rows) {
      const product = JSON.parse(row.data);
      if (product.isAvailable === available) continue;
      update.run(JSON.stringify({ ...product, isAvailable: available }), row.id);
      recordHistory(db, { ...product, archived: false }, "availability", [
        { field: "isAvailable", before: product.isAvailable, after: available },
      ], actor);
      changed = true;
    }
    return changed;
  });
}

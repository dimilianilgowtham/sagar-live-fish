import assert from "node:assert/strict";
import test from "node:test";

const query = await import("../src/lib/catalogue-query.ts").catch(() => ({}));
const defaults = {
  q: "",
  category: "all",
  sort: "featured",
  available: false,
  page: 1,
};
const fish = Array.from({ length: 29 }, (_, index) => ({
  id: `fish-${index}`,
  nameEn: `Fish ${index}`,
  nameTe: index === 2 ? "కొరమీను" : "చేప",
  descEn: "For curry",
  descTe: index === 2 ? "వేపుడు ప్రత్యేకం" : "తాజా చేప",
  category: index % 2 ? "marine" : "freshwater",
  pricePerKg: index === 0 ? null : index * 10,
  isAvailable: index % 3 !== 0,
  cuts: ["Curry cut"],
  icon: "🐟",
}));

test("catalogue URLs normalize malformed filters and bounded page numbers", () => {
  assert.equal(typeof query.parseCatalogueFilters, "function");
  assert.deepEqual(
    query.parseCatalogueFilters({
      category: "bad",
      sort: "bad",
      page: "-4",
      available: "true",
    }),
    defaults,
  );
  assert.equal(query.parseCatalogueFilters({ page: "1e9" }).page, 1);
  assert.equal(query.parseCatalogueFilters({ page: "Infinity" }).page, 1);
  assert.equal(
    query.parseCatalogueFilters({ page: "99999999999999999999" }).page,
    1,
  );
  assert.equal(
    query.parseCatalogueFilters({ q: ["  CATLA  ", "ignored"], available: "1" })
      .q,
    "CATLA",
  );
  assert.equal(
    query.parseCatalogueFilters({ q: "x".repeat(500) }).q.length,
    120,
  );
});

test("catalogue search includes Telugu descriptions, category and current stock", () => {
  assert.equal(typeof query.getCataloguePage, "function");
  assert.deepEqual(
    query
      .getCataloguePage(fish, { ...defaults, q: "వేపుడు" })
      .items.map((p) => p.id),
    ["fish-2"],
  );
  assert.deepEqual(
    query
      .getCataloguePage(fish, {
        ...defaults,
        q: "FISH 2",
        category: "marine",
        available: true,
      })
      .items.map((p) => p.id),
    ["fish-23", "fish-25"],
  );
});

test("pagination handles later pages, out-of-range URLs and empty matches", () => {
  assert.equal(typeof query.getCataloguePage, "function");
  const last = query.getCataloguePage(fish, { ...defaults, page: 999 });
  assert.equal(last.page, 3);
  assert.equal(last.totalPages, 3);
  assert.equal(last.items.length, 5);
  assert.equal(last.start, 25);
  assert.equal(last.end, 29);
  assert.equal(query.getCataloguePage(fish, defaults).items.length, 12);
  const empty = query.getCataloguePage(fish, {
    ...defaults,
    q: "does not exist",
    page: 2,
  });
  assert.deepEqual(
    [empty.page, empty.start, empty.end, empty.total],
    [1, 0, 0, 0],
  );
});

test("price sorting always places unpriced fish last and preserves source order", () => {
  assert.equal(typeof query.getCataloguePage, "function");
  assert.equal(
    query.getCataloguePage(fish, { ...defaults, sort: "price-low" }).items[0]
      .id,
    "fish-1",
  );
  assert.equal(
    query.getCataloguePage(fish, { ...defaults, sort: "price-high" }).items[0]
      .id,
    "fish-28",
  );
  assert.equal(
    query
      .getCataloguePage(fish, { ...defaults, sort: "price-high", page: 3 })
      .items.at(-1).id,
    "fish-0",
  );
  assert.equal(fish[0].id, "fish-0");
});

test("fish and shop links retain filters safely without accepting external destinations", () => {
  assert.equal(typeof query.shopHref, "function");
  assert.equal(typeof query.fishHref, "function");
  const filters = {
    ...defaults,
    q: "రొయ్యలు & #fish",
    category: "shellfish",
    sort: "price-high",
    available: true,
    page: 3,
  };
  const shop = query.shopHref(filters);
  const detail = query.fishHref("catch-custom", filters);
  const shopUrl = new URL(shop, "https://shop.example");
  const detailUrl = new URL(detail, "https://shop.example");
  assert.deepEqual(query.parseCatalogueFilters(shopUrl.searchParams), filters);
  assert.equal(detailUrl.pathname, "/fish/catch-custom");
  assert.equal(detailUrl.search, shopUrl.search);
  assert.equal(query.shopHref(defaults), "/shop");
  assert.equal(
    query
      .shopHref({ ...defaults, q: "https://other.example" })
      .startsWith("/shop?"),
    true,
  );
  assert.equal(
    query.fishHref("catla/other?x=1"),
    "/fish/catla%2Fother%3Fx%3D1",
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  estimate,
  buildOrderMessage,
  buildWholesaleMessage,
  readProducts,
  readBasket,
  whatsappUrl,
} from "./store.ts";

const products = [
  {
    id: "catla",
    nameEn: "Catla",
    nameTe: "కట్ల",
    category: "freshwater",
    icon: "🐟",
    descEn: "Fresh fish",
    descTe: "చేప",
    pricePerKg: 240,
    isAvailable: true,
    cuts: ["Curry Cut"],
  },
];
const item = {
  id: "one",
  productId: "catla",
  nameEn: "Catla",
  nameTe: "కట్ల",
  cut: "Curry Cut",
  weightKg: 1.5,
  pricePerKg: 240,
  approxTotal: 360,
};

test("estimates round to rupees and preserve unpriced products", () => {
  assert.equal(estimate(241, 0.5), 121);
  assert.equal(estimate(null, 2), null);
});

test("order handoff includes preparation, customer details and mixed pricing", () => {
  const message = buildOrderMessage(
    [item, { ...item, id: "two", pricePerKg: null, approxTotal: null }],
    "Anil",
    "Pickup",
  );
  assert.match(message, /Anil/);
  assert.match(message, /Pickup/);
  assert.match(message, /1.5 kg/);
  assert.match(message, /Curry Cut/);
  assert.match(message, /₹360/);
  assert.match(message, /unpriced items/);
  assert.match(message, /confirm/i);
  assert.ok(
    whatsappUrl(message).startsWith("https://wa.me/916305239969?text="),
  );
  assert.equal(new URL(whatsappUrl(message)).searchParams.get("text"), message);
});

test("wholesale enquiries preserve quantity and requested varieties", () => {
  const message = buildWholesaleMessage("Cafe", "Catla, prawns", "25–50 kg");
  assert.match(message, /Cafe/);
  assert.match(message, /Catla, prawns/);
  assert.match(message, /25–50 kg/);
});

test("unpriced-only baskets request a quote without suggesting a zero total", () => {
  const unpriced = { ...item, pricePerKg: null, approxTotal: null };
  const message = buildOrderMessage([unpriced], "", "");
  assert.match(message, /Estimated subtotal: Price on request/);
  assert.doesNotMatch(message, /₹0/);

  // A listed zero price is known; it must not be mistaken for a missing price.
  const mixed = buildOrderMessage(
    [{ ...item, pricePerKg: 0, approxTotal: 0 }, unpriced],
    "",
    "",
  );
  assert.match(mixed, /Estimated subtotal: ₹0 \+ unpriced items/);
});

test("delivery enquiries preserve the area and ask for details before an order", async () => {
  const { buildDeliveryMessage } = await import("./store.ts");
  assert.equal(typeof buildDeliveryMessage, "function");
  const message = buildDeliveryMessage("  విజయవాడ & Centre #2\n  520001  ");
  assert.match(message, /Area \/ PIN: విజయవాడ & Centre #2 520001/);
  assert.match(message, /delivery.*available/i);
  assert.match(message, /charges/i);
  assert.match(message, /minimum order/i);
  assert.match(message, /timing/i);
  assert.match(message, /before I place an order/i);
  const url = new URL(whatsappUrl(message));
  assert.equal(url.pathname, "/916305239969");
  assert.equal(url.searchParams.get("text"), message);
  assert.equal([...url.searchParams].length, 1);
});

test("delivery enquiries support Telugu and never insert an empty area", async () => {
  const { buildDeliveryMessage } = await import("./store.ts");
  assert.equal(typeof buildDeliveryMessage, "function");
  assert.match(
    buildDeliveryMessage("  గుంటూరు  ", "te"),
    /ప్రాంతం \/ పిన్: గుంటూరు/,
  );
  assert.match(buildDeliveryMessage("గుంటూరు", "te"), /డెలివరీ/);
  assert.match(buildDeliveryMessage(" \n "), /Please ask me for my area/);
});

test("broken or malformed stored catalogue cannot break the storefront", () => {
  assert.deepEqual(readProducts("{broken", products), products);
  assert.deepEqual(readProducts("{}", products), products);
  const saved = JSON.stringify([
    { id: "catla", pricePerKg: -10, isAvailable: false, nameEn: "Corrupt" },
  ]);
  const restored = readProducts(saved, products);
  assert.equal(restored[0].pricePerKg, 240);
  assert.equal(restored[0].isAvailable, false);
  assert.equal(restored[0].nameEn, "Catla");
  assert.equal(
    readProducts(
      JSON.stringify([{ id: "catla", pricePerKg: null }]),
      products,
    )[0].pricePerKg,
    null,
  );
});

test("restored basket discards invalid weights, unknown products and cuts; recalculates estimates", () => {
  const saved = JSON.stringify([
    item,
    { ...item, id: "bad", weightKg: -1 },
    { ...item, id: "unknown", productId: "missing" },
    { ...item, id: "cut", cut: "Invalid cut" },
    { ...item, id: "tampered", approxTotal: 1 },
  ]);
  const restored = readBasket(saved, products);
  assert.equal(restored.length, 2);
  assert.equal(restored[1].approxTotal, 360);
  assert.deepEqual(readBasket("{bad", products), []);
});

test("failed browser writes remain usable and never report a persistent save", async () => {
  const { createStorageAdapter } = await import("./store.ts");
  let blocked = true;
  let stored = "old value";
  const adapter = createStorageAdapter(() => ({
    getItem() {
      return stored;
    },
    setItem(_key, value) {
      if (blocked) throw new Error("Quota exceeded");
      stored = value;
    },
  }));
  assert.equal(adapter.write("basket", "new value"), false);
  assert.equal(adapter.read("basket"), "new value");
  blocked = false;
  assert.equal(adapter.write("basket", "saved value"), true);
  assert.equal(adapter.read("basket"), "saved value");
});

test("blocked access to browser storage preserves the basket for the current visit", async () => {
  const { createStorageAdapter } = await import("./store.ts");
  const adapter = createStorageAdapter(() => {
    throw new Error("Storage blocked");
  });
  assert.equal(adapter.read("basket"), null);
  assert.equal(adapter.write("basket", "items"), false);
  assert.equal(adapter.read("basket"), "items");
});

test("new owner-created products and their uploaded images survive a basket reload", () => {
  const catalogue = [
    {
      ...products[0],
      id: "catch-custom",
      image: "/api/media/12345678-1234-4123-8123-123456789abc",
    },
  ];
  const stored = JSON.stringify([{ ...item, productId: "catch-custom" }]);
  const basket = readBasket(stored, catalogue);
  assert.equal(basket.length, 1);
  assert.equal(basket[0].productId, "catch-custom");
  assert.equal(basket[0].image, catalogue[0].image);
});

test("a basket follows current shared rates and excludes fish that are sold out", () => {
  const saved = JSON.stringify([item]);
  const updated = readBasket(saved, [{ ...products[0], pricePerKg: 275 }]);
  assert.equal(updated[0].pricePerKg, 275);
  assert.equal(updated[0].approxTotal, 413);
  assert.deepEqual(
    readBasket(saved, [{ ...products[0], isAvailable: false }]),
    [],
  );
  assert.deepEqual(
    readBasket(saved, [{ ...products[0], cuts: ["Whole cleaned"] }]),
    [],
  );
});

import type { BasketItem, Product } from "../types";

export const PHONE = "6305239969";
export const WHATSAPP_PHONE = "916305239969";
export const estimate = (price: number | null, weight: number) =>
  price === null ? null : Math.round(price * weight);
export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export const whatsappUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

export function buildDeliveryMessage(
  area: string,
  language: "en" | "te" = "en",
) {
  const location = area.replace(/\s+/g, " ").trim();
  if (language === "te") {
    return [
      "*SAGAR LIVE FISH — డెలివరీ విచారణ*",
      `ప్రాంతం / పిన్: ${location || "నా ప్రాంతం వివరాలు అడగండి"}`,
      "",
      "నా ప్రాంతానికి డెలివరీ ఉందా? ఆర్డర్ చేసే ముందు డెలివరీ ఛార్జీలు, కనీస ఆర్డర్, సమయం మరియు పికప్ వివరాలు నిర్ధారించండి.",
    ].join("\n");
  }
  return [
    "*SAGAR LIVE FISH — DELIVERY ENQUIRY*",
    `Area / PIN: ${location || "Please ask me for my area"}`,
    "",
    "Is delivery available to my area? Please confirm delivery charges, minimum order, timing and pickup options before I place an order.",
  ].join("\n");
}

export function buildOrderMessage(
  items: BasketItem[],
  name: string,
  area: string,
) {
  const total = items.reduce((sum, item) => sum + (item.approxTotal ?? 0), 0);
  const unpriced = items.some((item) => item.approxTotal === null);
  const hasPriced = items.some((item) => item.approxTotal !== null);
  const subtotal =
    unpriced && !hasPriced
      ? "Price on request"
      : `${currency(total)}${unpriced ? " + unpriced items" : ""}`;
  return [
    "*SAGAR LIVE FISH — ORDER ENQUIRY*",
    `Customer: ${name.trim() || "Not provided"}`,
    `Area / pickup: ${area.trim() || "Please confirm with me"}`,
    "",
    ...items.map(
      (item, i) =>
        `${i + 1}. *${item.nameEn} (${item.nameTe})*\n   ${item.weightKg} kg · ${item.cut}\n   ${item.approxTotal === null ? "Price on request" : `Estimated ${currency(item.approxTotal)}`}`,
    ),
    "",
    `*Estimated subtotal: ${subtotal}*`,
    "Please confirm availability, whole vs cleaned weight, final price and pickup or delivery options before preparing my order.",
  ].join("\n");
}

export function buildWholesaleMessage(
  business: string,
  varieties: string,
  quantity: string,
) {
  return [
    "*SAGAR LIVE FISH — WHOLESALE ENQUIRY*",
    `Business / event: ${business.trim() || "Please contact me"}`,
    `Varieties: ${varieties.trim() || "Please share available catch"}`,
    `Quantity: ${quantity}`,
    "",
    "Please share current wholesale rates, availability, preparation and delivery options.",
  ].join("\n");
}

function parseList(raw: string | null): Record<string, unknown>[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "null");
    return Array.isArray(parsed)
      ? parsed.filter(
          (v): v is Record<string, unknown> =>
            !!v && typeof v === "object" && !Array.isArray(v),
        )
      : [];
  } catch {
    return [];
  }
}

const validPrice = (v: unknown): v is number | null =>
  v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0);

export function readProducts(
  raw: string | null,
  defaults: Product[],
): Product[] {
  const stored = parseList(raw);
  return defaults.map((product) => {
    const saved = stored.find((item) => item.id === product.id);
    if (!saved) return product;
    return {
      ...product,
      pricePerKg: validPrice(saved.pricePerKg)
        ? saved.pricePerKg
        : product.pricePerKg,
      isAvailable:
        typeof saved.isAvailable === "boolean"
          ? saved.isAvailable
          : product.isAvailable,
    };
  });
}

export function readBasket(
  raw: string | null,
  products: Product[],
): BasketItem[] {
  const ids = new Set<string>();
  return parseList(raw).flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (
      !product?.isAvailable ||
      typeof item.id !== "string" ||
      ids.has(item.id) ||
      typeof item.weightKg !== "number" ||
      !Number.isFinite(item.weightKg) ||
      item.weightKg < 0.5 ||
      item.weightKg > 500 ||
      typeof item.cut !== "string" ||
      !product.cuts.includes(item.cut) ||
      !validPrice(item.pricePerKg)
    )
      return [];
    ids.add(item.id);
    return [
      {
        id: item.id,
        productId: product.id,
        image: product.image,
        nameEn: product.nameEn,
        nameTe: product.nameTe,
        cut: item.cut,
        weightKg: item.weightKg,
        pricePerKg: product.pricePerKg,
        approxTotal: estimate(product.pricePerKg, item.weightKg),
      },
    ];
  });
}

/** Keep ordering usable when browser storage is blocked or its quota is full. */
export function createStorageAdapter(
  getStorage: () => Pick<Storage, "getItem" | "setItem">,
) {
  const memory = new Map<string, string>();
  const memoryOnly = new Set<string>();
  return {
    read(key: string): string | null {
      if (memoryOnly.has(key)) return memory.get(key) ?? null;
      try {
        return getStorage().getItem(key);
      } catch {
        return memory.get(key) ?? null;
      }
    },
    write(key: string, value: string): boolean {
      memory.set(key, value);
      try {
        getStorage().setItem(key, value);
        memoryOnly.delete(key);
        return true;
      } catch {
        memoryOnly.add(key);
        return false;
      }
    },
  };
}

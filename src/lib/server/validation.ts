import type { Product } from "../../types/index.ts";
import { HttpError } from "./errors.ts";

const categories = ["freshwater", "marine", "shellfish"];
const staticImages = new Set(
  [
    "hero",
    "catla",
    "korameenu",
    "prawns",
    "crabs",
    "seelavathi",
    "apollo",
    "tuna",
    "nethallu",
  ].map((id) => `/images/${id}.webp`),
);
export function validImagePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (staticImages.has(value) ||
      /^\/api\/media\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
        value,
      ))
  );
}
function text(value: unknown, name: string, max: number, min = 0): string {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new HttpError(
      400,
      `${name} must contain ${min ? `${min}–` : "at most "}${max} characters.`,
    );
  return value.trim();
}
export function validateProduct(input: unknown, existing?: Product): Product {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new HttpError(400, "Provide a valid product.");
  const data = { ...existing, ...input } as Record<string, unknown>;
  const nameEn = text(data.nameEn, "English name", 120, 2);
  if (typeof data.category !== "string" || !categories.includes(data.category))
    throw new HttpError(400, "Choose a valid seafood category.");
  if (
    data.pricePerKg !== null &&
    (typeof data.pricePerKg !== "number" ||
      !Number.isFinite(data.pricePerKg) ||
      data.pricePerKg < 0 ||
      data.pricePerKg > 1000000)
  )
    throw new HttpError(
      400,
      "Price must be between ₹0 and ₹1,000,000, or left empty.",
    );
  if (typeof data.isAvailable !== "boolean")
    throw new HttpError(400, "Choose a valid availability status.");
  if (
    !Array.isArray(data.cuts) ||
    data.cuts.length < 1 ||
    data.cuts.length > 12
  )
    throw new HttpError(400, "Add between 1 and 12 preparation options.");
  const cuts = [
    ...new Set(data.cuts.map((cut) => text(cut, "Preparation option", 80, 1))),
  ];
  const image = data.image ?? "/images/hero.webp";
  if (!validImagePath(image))
    throw new HttpError(
      400,
      "Choose a catalogue image or upload a JPEG, PNG or WebP photo.",
    );
  return {
    id: existing?.id || "",
    nameEn,
    nameTe: text(data.nameTe ?? "", "Telugu name", 120) || nameEn,
    category: data.category as Product["category"],
    icon: text(data.icon ?? "🐟", "Icon", 12),
    descEn: text(data.descEn ?? "", "Description", 1200),
    descTe:
      text(data.descTe ?? "", "Telugu description", 1200) ||
      text(data.descEn ?? "", "Description", 1200),
    pricePerKg: data.pricePerKg as number | null,
    isAvailable: data.isAvailable,
    badge: text(data.badge ?? "", "Badge", 60),
    cuts,
    image,
  };
}

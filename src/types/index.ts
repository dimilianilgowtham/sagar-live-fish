export type SeafoodCategory = "all" | "freshwater" | "marine" | "shellfish";

export interface Product {
  image?: string;
  id: string;
  nameEn: string;
  nameTe: string;
  category: "freshwater" | "marine" | "shellfish";
  icon: string;
  descEn: string;
  descTe: string;
  pricePerKg: number | null; // null represents "Price on request"
  isAvailable: boolean;
  badge?: string;
  cuts: string[];
}

export interface BasketItem {
  image?: string;
  id: string;
  productId: string;
  nameEn: string;
  nameTe: string;
  cut: string;
  weightKg: number;
  pricePerKg: number | null;
  approxTotal: number | null;
}

export interface StoreState {
  lastUpdated: string;
  verifiedStockCount: number;
}

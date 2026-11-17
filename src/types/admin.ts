import type { Product } from "./index";

export interface CatalogueSnapshot {
  products: Product[];
  revision: number;
  updatedAt: string;
}
export interface ManagedProduct extends Product {
  archived: boolean;
}
export interface AdminCatalogue {
  products: ManagedProduct[];
  revision: number;
  updatedAt: string;
}
export interface OwnerIdentity {
  name: string;
  email: string;
}

export type CatalogueHistoryAction =
  | "create"
  | "update"
  | "archive"
  | "restore"
  | "availability";
export type CatalogueHistoryValue = string | number | boolean | string[] | null;
export interface CatalogueFieldChange {
  field: Exclude<keyof ManagedProduct, "id">;
  before: CatalogueHistoryValue;
  after: CatalogueHistoryValue;
}
export interface CatalogueHistoryEntry {
  id: number;
  productId: string;
  productName: string;
  action: CatalogueHistoryAction;
  actor: OwnerIdentity | null;
  occurredAt: string;
  changes: CatalogueFieldChange[];
}
export interface CatalogueHistoryPage {
  entries: CatalogueHistoryEntry[];
  nextCursor: string | null;
}

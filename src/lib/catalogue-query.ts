import type { Product, SeafoodCategory } from "../types/index.ts";

export type CatalogueFilters = {
  q: string;
  category: SeafoodCategory;
  sort: "featured" | "price-low" | "price-high";
  available: boolean;
  page: number;
};
export type CatalogueSearchParams = Record<
  string,
  string | string[] | undefined
>;
export const PAGE_SIZE = 12;
export const DEFAULT_FILTERS: CatalogueFilters = {
  q: "",
  category: "all",
  sort: "featured",
  available: false,
  page: 1,
};

export function parseCatalogueFilters(
  input: CatalogueSearchParams | URLSearchParams,
): CatalogueFilters {
  const read = (key: string) => {
    const value =
      input instanceof URLSearchParams ? input.get(key) : input[key];
    return Array.isArray(value) ? value[0] || "" : value || "";
  };
  const category = read("category");
  const sort = read("sort");
  const page = read("page");
  return {
    q: read("q").trim().slice(0, 120),
    category: ["freshwater", "marine", "shellfish"].includes(category)
      ? (category as SeafoodCategory)
      : "all",
    sort: sort === "price-low" || sort === "price-high" ? sort : "featured",
    available: read("available") === "1",
    page:
      /^[1-9]\d*$/.test(page) && Number.isSafeInteger(Number(page))
        ? Number(page)
        : 1,
  };
}

export function getCataloguePage(
  products: Product[],
  filters: CatalogueFilters,
) {
  const term = filters.q.normalize("NFKC").toLocaleLowerCase("en-IN");
  const matches = products.filter(
    (product) =>
      (filters.category === "all" || product.category === filters.category) &&
      (!filters.available || product.isAvailable) &&
      (!term ||
        `${product.nameEn} ${product.nameTe} ${product.descEn} ${product.descTe}`
          .normalize("NFKC")
          .toLocaleLowerCase("en-IN")
          .includes(term)),
  );
  if (filters.sort !== "featured") {
    matches.sort((a, b) => {
      if (a.pricePerKg === null) return b.pricePerKg === null ? 0 : 1;
      if (b.pricePerKg === null) return -1;
      return filters.sort === "price-low"
        ? a.pricePerKg - b.pricePerKg
        : b.pricePerKg - a.pricePerKg;
    });
  }
  const total = matches.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.max(1, Math.min(totalPages, Math.trunc(filters.page) || 1));
  const offset = (page - 1) * PAGE_SIZE;
  return {
    items: matches.slice(offset, offset + PAGE_SIZE),
    total,
    totalPages,
    page,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + PAGE_SIZE, total),
  };
}

function filterQuery(input: Partial<CatalogueFilters> = {}) {
  const filters = { ...DEFAULT_FILTERS, ...input };
  const params = new URLSearchParams();
  if (["freshwater", "marine", "shellfish"].includes(filters.category))
    params.set("category", filters.category);
  if (filters.q.trim()) params.set("q", filters.q.trim().slice(0, 120));
  if (filters.sort === "price-low" || filters.sort === "price-high")
    params.set("sort", filters.sort);
  if (filters.available) params.set("available", "1");
  if (Number.isSafeInteger(filters.page) && filters.page > 1)
    params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
export function shopHref(filters: Partial<CatalogueFilters> = {}) {
  return `/shop${filterQuery(filters)}`;
}
export function fishHref(id: string, filters?: Partial<CatalogueFilters>) {
  return `/fish/${encodeURIComponent(id)}${filterQuery(filters)}`;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Fish,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Waves,
  Shrimp,
  X,
} from "lucide-react";
import {
  getCataloguePage,
  DEFAULT_FILTERS,
  shopHref,
  type CatalogueFilters,
} from "@/lib/catalogue-query";
import { ProductCard } from "./product-card";
import { PageIntro } from "./page-intro";
import { useStore } from "./store-provider";

export default function CataloguePage({
  filters: initialFilters,
}: {
  filters: CatalogueFilters;
}) {
  const { products, unavailable, language, t, chooseProduct } = useStore();
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const changeFilters = (next: CatalogueFilters) => {
    setFilters(next);
    router.push(shopHref(next), { scroll: false });
  };
  const result = getCataloguePage(products, filters);
  const current = { ...filters, page: result.page };
  const categories = [
    { id: "all", label: t("All seafood", "అన్ని రకాలు"), icon: Waves },
    {
      id: "freshwater",
      label: t("Freshwater fish", "తీపి నీటి చేపలు"),
      icon: Fish,
    },
    { id: "marine", label: t("From the sea", "సముద్రపు చేపలు"), icon: Waves },
    {
      id: "shellfish",
      label: t("Prawns & crabs", "రొయ్యలు & పీతలు"),
      icon: Shrimp,
    },
  ] as const;
  const pageNumbers = [
    ...new Set([
      1,
      result.page - 1,
      result.page,
      result.page + 1,
      result.totalPages,
    ]),
  ]
    .filter((page) => page >= 1 && page <= result.totalPages)
    .sort((a, b) => a - b);
  return (
    <>
      <PageIntro
        index="01"
        eyebrow={["THE FISH COUNTER", "మా చేపలు"]}
        title={["A world of water.", "తాజా చేపలు."]}
        accent={["A catch for you.", "మీ కోసం."]}
        description={[
          "Freshwater favourites, sea treasures and everything in between. Find the fish for your next good meal.",
          "తీపి నీటి చేపలు, సముద్రపు రుచులు, రొయ్యలు, పీతలు. మీ తదుపరి వంటకు సరైన చేపను ఎంచుకోండి.",
        ]}
      >
        <span className="intro-catch-count">
          <span className="status-dot" />
          {products.length} {t("varieties at the counter", "రకాలు అందుబాటులో")}
        </span>
      </PageIntro>
      <section
        className="shop-catalogue section-padding"
        aria-label={t("Seafood catalogue", "చేపల జాబితా")}
      >
        <div className="container shop-layout">
          <aside className="shop-sidebar">
            <p className="eyebrow">{t("FIND YOUR CATCH", "మీకు నచ్చిన రకం")}</p>
            <nav
              className="shop-category-list"
              aria-label={t("Seafood categories", "చేపల రకాలు")}
            >
              {categories.map(({ id, label, icon: Icon }) => (
                <Link
                  key={id}
                  href={shopHref({ ...current, category: id, page: 1 })}
                  onNavigate={() =>
                    setFilters({ ...current, category: id, page: 1 })
                  }
                  className={filters.category === id ? "selected" : ""}
                  aria-current={filters.category === id ? "true" : undefined}
                >
                  <Icon size={19} strokeWidth={1.4} />
                  <span>{label}</span>
                  <small>
                    {id === "all"
                      ? products.length
                      : products.filter((product) => product.category === id)
                          .length}
                  </small>
                </Link>
              ))}
            </nav>
            <div className="shop-stock-filter">
              <label>
                <input
                  type="checkbox"
                  checked={filters.available}
                  onChange={(event) =>
                    changeFilters({
                      ...current,
                      available: event.target.checked,
                      page: 1,
                    })
                  }
                />
                {t("Available only", "లభ్యమైనవి మాత్రమే")}
              </label>
              <p>
                {t(
                  "The shop confirms today’s catch and final rates when you enquire.",
                  "మీ విచారణ తర్వాత తాజా లభ్యత, తుది ధరలను షాప్ నిర్ధారిస్తుంది.",
                )}
              </p>
            </div>
            <div className="shop-sidebar-help">
              <Fish size={27} strokeWidth={1.2} />
              <h3>{t("A cut above.", "మీకు నచ్చిన కట్స్.")}</h3>
              <p>
                {t(
                  "Curry cut, fry slices or whole cleaned. Every good meal starts your way.",
                  "కూర ముక్కలు, వేపుడు ముక్కలు లేదా మొత్తం చేప. మీకు నచ్చిన విధంగా ఎంచుకోండి.",
                )}
              </p>
              <Link href="/how-to-order">
                {t("See how to order", "ఆర్డర్ విధానం చూడండి")}
                <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
          <div className="shop-results" id="results">
            <form
              className="shop-search"
              action="/shop"
              method="get"
              key={JSON.stringify(filters)}
            >
              <Search size={19} />
              <input
                name="q"
                type="search"
                aria-label={t("Search seafood", "చేపలను వెతకండి")}
                placeholder={t(
                  "Search fish in English or Telugu…",
                  "ఇంగ్లీష్ లేదా తెలుగులో వెతకండి…",
                )}
                defaultValue={filters.q}
                maxLength={120}
              />
              <input type="hidden" name="category" value={filters.category} />
              <input type="hidden" name="sort" value={filters.sort} />
              {filters.available && (
                <input type="hidden" name="available" value="1" />
              )}
              <button type="submit">
                {t("Search", "వెతకండి")}
                <ArrowRight size={15} />
              </button>
            </form>
            <div className="shop-result-meta">
              <p role="status">
                {result.total
                  ? t(
                      `Showing ${result.start}–${result.end} of ${result.total} varieties`,
                      `${result.total} రకాల్లో ${result.start}–${result.end}`,
                    )
                  : t("No matches just yet", "ఈ రకం దొరకలేదు")}
              </p>
              <label className="sort-control">
                <SlidersHorizontal size={14} />
                <span className="sr-only">
                  {t("Sort products", "క్రమబద్ధీకరించండి")}
                </span>
                <select
                  aria-label={t("Sort products", "క్రమబద్ధీకరించండి")}
                  value={filters.sort}
                  onChange={(event) =>
                    changeFilters({
                      ...current,
                      sort: event.target.value as CatalogueFilters["sort"],
                      page: 1,
                    })
                  }
                >
                  <option value="featured">
                    {t("Our selection", "మా ఎంపిక")}
                  </option>
                  <option value="price-low">
                    {t("Price: low to high", "ధర: తక్కువ నుండి ఎక్కువ")}
                  </option>
                  <option value="price-high">
                    {t("Price: high to low", "ధర: ఎక్కువ నుండి తక్కువ")}
                  </option>
                </select>
              </label>
            </div>
            {(filters.q || filters.available || filters.category !== "all") && (
              <div className="active-filters">
                {filters.q && (
                  <span>
                    {t("Search:", "వెతుకుతున్నది:")} {filters.q}
                  </span>
                )}
                <Link
                  href="/shop"
                  onNavigate={() => setFilters(DEFAULT_FILTERS)}
                >
                  {t("Clear filters", "అన్నీ చూపించు")}
                  <X size={12} />
                </Link>
              </div>
            )}
            {unavailable && (
              <p className="catalogue-live-warning" role="status">
                {t(
                  "Live availability couldn’t refresh. Please confirm with the shop.",
                  "లభ్యత నవీకరించలేకపోయాం. షాప్‌తో నిర్ధారించండి.",
                )}
              </p>
            )}
            <div className="product-grid shop-product-grid">
              {result.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  onChoose={chooseProduct}
                  filters={current}
                />
              ))}
            </div>
            {!result.total && (
              <div className="no-results">
                <Fish size={42} strokeWidth={1} />
                <h2>
                  {t("Another catch is waiting.", "మరిన్ని రకాలు చూడండి.")}
                </h2>
                <p>
                  {t(
                    "Try a different name, category or availability filter.",
                    "వేరే పేరు లేదా చేప రకంతో వెతకండి.",
                  )}
                </p>
                <Link
                  href="/shop"
                  className="button button-navy"
                  onNavigate={() => setFilters(DEFAULT_FILTERS)}
                >
                  {t("Browse all seafood", "అన్ని చేపలు చూడండి")}
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
            {result.totalPages > 1 && (
              <nav
                className="pagination"
                aria-label={t("Catalogue pages", "చేపల జాబితా పేజీలు")}
              >
                {result.page > 1 ? (
                  <Link
                    href={shopHref({ ...current, page: result.page - 1 })}
                    onNavigate={() =>
                      setFilters({ ...current, page: result.page - 1 })
                    }
                    aria-label={t("Previous page", "ముందు పేజీ")}
                  >
                    <ArrowLeft size={17} />
                  </Link>
                ) : (
                  <span className="pagination-disabled">
                    <ArrowLeft size={17} />
                  </span>
                )}
                {pageNumbers.map((page, index) => (
                  <span className="page-number-wrap" key={page}>
                    {index > 0 && page - pageNumbers[index - 1] > 1 && (
                      <span className="pagination-gap">…</span>
                    )}
                    <Link
                      href={shopHref({ ...current, page })}
                      onNavigate={() => setFilters({ ...current, page })}
                      aria-label={t(`Page ${page}`, `పేజీ ${page}`)}
                      aria-current={page === result.page ? "page" : undefined}
                    >
                      {page}
                    </Link>
                  </span>
                ))}
                {result.page < result.totalPages ? (
                  <Link
                    href={shopHref({ ...current, page: result.page + 1 })}
                    onNavigate={() =>
                      setFilters({ ...current, page: result.page + 1 })
                    }
                    aria-label={t("Next page", "తర్వాతి పేజీ")}
                  >
                    <ArrowRight size={17} />
                  </Link>
                ) : (
                  <span className="pagination-disabled">
                    <ArrowRight size={17} />
                  </span>
                )}
              </nav>
            )}
            <p className="catalogue-footnote">
              <ShieldCheck size={16} />
              {t(
                "Prices are estimates per kg. Final weight, rate and availability are confirmed by the shop. Images are illustrative.",
                "కిలో ధరలు అంచనా మాత్రమే. తుది బరువు, ధర, లభ్యతను షాప్ నిర్ధారిస్తుంది. చిత్రాలు సూచన కోసం మాత్రమే.",
              )}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Product } from "@/types";
import { currency } from "@/lib/store";
import { fishHref, type CatalogueFilters } from "@/lib/catalogue-query";

export function ProductCard({
  product,
  language,
  onChoose,
  filters,
}: {
  product: Product;
  language: "en" | "te";
  onChoose: (product: Product) => void;
  filters?: CatalogueFilters;
}) {
  const isTelugu = language === "te";
  const name = isTelugu ? product.nameTe : product.nameEn;
  const category = {
    freshwater: isTelugu ? "తీపి నీటి చేపలు" : "Freshwater",
    marine: isTelugu ? "సముద్రపు చేపలు" : "Sea catch",
    shellfish: isTelugu ? "రొయ్యలు & పీతలు" : "Shellfish",
  }[product.category];
  const action = product.isAvailable
    ? isTelugu
      ? "ఎంచుకోండి"
      : "Choose cut"
    : isTelugu
      ? "అందుబాటులో లేదు"
      : "Sold out";
  return (
    <article
      className={`product-card${!product.isAvailable ? " is-sold-out" : ""}`}
    >
      <Link
        className="product-photo"
        href={fishHref(product.id, filters)}
        aria-label={`${name}: ${isTelugu ? "వివరాలు చూడండి" : "view details"}`}
      >
        <Image
          src={product.image || `/images/${product.id}.webp`}
          alt={name}
          fill
          sizes="(max-width: 560px) 94vw, (max-width: 1000px) 46vw, 23vw"
        />
        <span
          className={`product-badge${product.id === "korameenu" ? " badge-special" : ""}`}
        >
          {!product.isAvailable
            ? isTelugu
              ? "అందుబాటులో లేదు"
              : "Sold out"
            : isTelugu
              ? "తాజా చేపలు"
              : product.badge || "Fresh catch"}
        </span>
        <span className="photo-arrow">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="product-info">
        <p className="product-category">{category}</p>
        <h3 lang={isTelugu ? "te" : "en"}>
          <Link href={fishHref(product.id, filters)}>
            {isTelugu ? product.nameTe : product.nameEn.replace(/ \(.+\)/, "")}
          </Link>
        </h3>
        <p className="product-local-name" lang={isTelugu ? "en" : "te"}>
          {isTelugu ? product.nameEn : product.nameTe}
        </p>
        <p className="product-description" lang={isTelugu ? "te" : "en"}>
          {isTelugu ? product.descTe : product.descEn}
        </p>
        <div className="product-bottom">
          <div className="product-price">
            {product.pricePerKg === null ? (
              <span className="price-on-request">
                {isTelugu ? "ధర అడగండి" : "Ask for price"}
              </span>
            ) : (
              <>
                <strong>{currency(product.pricePerKg)}</strong>
                <span> / kg</span>
              </>
            )}
          </div>
          <button
            className="choose-button"
            disabled={!product.isAvailable}
            onClick={() => onChoose(product)}
            aria-label={`${name} — ${action}`}
          >
            {action}
            {product.isAvailable && <Plus size={15} />}
          </button>
        </div>
      </div>
    </article>
  );
}

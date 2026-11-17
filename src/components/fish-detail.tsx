"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Fish,
  MessageCircle,
  ShieldCheck,
  Waves,
} from "lucide-react";
import type { Product } from "@/types";
import { currency, whatsappUrl } from "@/lib/store";
import { shopHref, type CatalogueFilters } from "@/lib/catalogue-query";
import { useStore } from "./store-provider";
import { ProductOrderForm } from "./product-order-form";
import { ProductCard } from "./product-card";

export default function FishDetail({
  initialProduct,
  serverRevision,
  filters,
}: {
  initialProduct: Product;
  serverRevision: number;
  filters: CatalogueFilters;
}) {
  const {
    products,
    revision,
    language,
    t,
    chooseProduct,
    addToBasket,
    unavailable,
  } = useStore();
  const product =
    revision < serverRevision
      ? initialProduct
      : products.find((item) => item.id === initialProduct.id);
  if (!product) return <MissingCatch />;
  const te = language === "te";
  const category =
    product.category === "freshwater"
      ? t("Freshwater fish", "తీపి నీటి చేపలు")
      : product.category === "marine"
        ? t("From the sea", "సముద్రపు చేపలు")
        : t("Prawns & crabs", "రొయ్యలు & పీతలు");
  const related = products
    .filter(
      (item) => item.id !== product.id && item.category === product.category,
    )
    .slice(0, 4);
  return (
    <>
      <div className="container detail-navigation">
        <nav
          className="breadcrumbs"
          aria-label={t("Breadcrumb", "పేజీ మార్గం")}
        >
          <Link href="/">{t("Home", "హోమ్")}</Link>
          <ChevronRight size={12} />
          <Link href={shopHref(filters)}>
            {t("The fish counter", "మా చేపలు")}
          </Link>
          <ChevronRight size={12} />
          <span>{te ? product.nameTe : product.nameEn}</span>
        </nav>
        <Link className="back-to-results" href={shopHref(filters)}>
          <ArrowLeft size={14} />
          {t("Back to results", "జాబితాకు తిరిగి వెళ్ళండి")}
        </Link>
      </div>
      <section
        className="container fish-detail-grid"
        aria-labelledby="fish-name"
      >
        <div className="fish-detail-visual">
          <div className="fish-detail-photo">
            <Image
              src={product.image || `/images/${product.id}.webp`}
              alt={te ? product.nameTe : product.nameEn}
              fill
              sizes="(max-width:760px) 94vw, 53vw"
              preload
            />
            <span
              className={`detail-stock-label${!product.isAvailable ? " sold-out" : ""}`}
            >
              <span className="status-dot" />
              {product.isAvailable
                ? t("AT THE COUNTER", "లభ్యం")
                : t("SOLD OUT FOR NOW", "ప్రస్తుతం అందుబాటులో లేదు")}
            </span>
            <span className="detail-image-index">
              <Waves size={17} />
              SAGAR / {product.category.toUpperCase()}
            </span>
          </div>
          <div className="detail-photo-note">
            <ShieldCheck size={16} />
            <p>
              {t(
                "Images are illustrative. Your actual catch and final weight are confirmed by the shop.",
                "చిత్రాలు సూచన కోసం మాత్రమే. మీ చేప, తుది బరువును షాప్ నిర్ధారిస్తుంది.",
              )}
            </p>
          </div>
          <div className="detail-qualities">
            <span>
              <Check size={15} />
              {t("Prepared your way", "మీకు నచ్చిన కట్స్")}
            </span>
            <span>
              <Check size={15} />
              {t("Direct from the shop", "షాప్‌తో నేరుగా")}
            </span>
          </div>
        </div>
        <div className="fish-detail-copy">
          <p className="eyebrow">
            {category} <span>/</span>{" "}
            {product.badge || t("THE SAGAR SELECTION", "సాగర్ ఎంపిక")}
          </p>
          <h1 id="fish-name" lang={te ? "te" : "en"}>
            {te ? product.nameTe : product.nameEn.replace(/ \(.+\)/, "")}
          </h1>
          <p className="detail-local-name" lang={te ? "en" : "te"}>
            {te ? product.nameEn : product.nameTe}
          </p>
          <p className="detail-description">
            {te ? product.descTe : product.descEn}
          </p>
          <div className="detail-rate">
            <strong>
              {product.pricePerKg === null
                ? t("Ask for today’s price", "ఈరోజు ధర అడగండి")
                : currency(product.pricePerKg)}
            </strong>
            {product.pricePerKg !== null && (
              <span>{t("per kg · estimated", "కిలోకు · అంచనా")}</span>
            )}
          </div>
          {unavailable && (
            <p className="catalogue-live-warning" role="status">
              {t(
                "Please confirm the latest availability with the shop.",
                "తాజా లభ్యతను షాప్‌తో నిర్ధారించండి.",
              )}
            </p>
          )}
          {product.isAvailable ? (
            revision < serverRevision ? (
              <p className="detail-checking" role="status">
                {t("Checking the latest catch…", "తాజా వివరాలు చూస్తున్నాం…")}
              </p>
            ) : (
              <ProductOrderForm
                key={product.id}
                product={product}
                language={language}
                onAdd={addToBasket}
              />
            )
          ) : (
            <div className="detail-sold-out">
              <h2>
                {t("Back in the water for now.", "త్వరలో మళ్ళీ అందుబాటులోకి.")}
              </h2>
              <p>
                {t(
                  "This fish is currently sold out. Ask the shop about the next catch or explore another favourite.",
                  "ఈ చేప ప్రస్తుతం అందుబాటులో లేదు. తదుపరి లభ్యత గురించి షాప్‌ను అడగండి లేదా మరిన్ని చేపలు చూడండి.",
                )}
              </p>
              <a
                className="button button-navy"
                href={whatsappUrl(
                  t(
                    `Hello Sagar Live Fish! When will ${product.nameEn} be available again?`,
                    `నమస్కారం! ${product.nameTe} మళ్ళీ ఎప్పుడు లభిస్తుంది?`,
                  ),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={17} />
                {t("Ask about the next catch", "తదుపరి లభ్యత అడగండి")}
              </a>
            </div>
          )}
          <Link className="detail-delivery-link" href="/delivery">
            {t(
              "Delivery, pickup & your questions",
              "డెలివరీ, పికప్ & సందేహాలు",
            )}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
      {related.length > 0 && (
        <section className="related-section section-padding">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {t(
                    "GOOD COMPANY FOR YOUR TABLE",
                    "మీ భోజనానికి మరిన్ని రుచులు",
                  )}
                </p>
                <h2>
                  {t("More to ", "మరిన్ని ")}
                  <em>{t("fall for.", "తాజా ఎంపికలు.")}</em>
                </h2>
              </div>
              <Link className="text-link" href="/shop">
                {t("Browse all seafood", "అన్ని చేపలు చూడండి")}
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard
                  product={item}
                  language={language}
                  onChoose={chooseProduct}
                  filters={filters}
                  key={item.id}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function MissingCatch() {
  const { t } = useStore();
  return (
    <section className="missing-catch container">
      <Fish size={54} strokeWidth={1} />
      <p className="eyebrow">
        404 / {t("A LITTLE OFF COURSE", "ఈ పేజీ దొరకలేదు")}
      </p>
      <h1>
        {t("This catch has ", "ఈ చేప వివరాలు ")}
        <em>{t("sailed on.", "అందుబాటులో లేవు.")}</em>
      </h1>
      <p>
        {t(
          "This fish may no longer be listed. There’s more to discover at the counter.",
          "ఈ చేప జాబితాలో లేకపోవచ్చు. మరిన్ని చేపలు చూడండి.",
        )}
      </p>
      <Link className="button button-navy" href="/shop">
        {t("Back to the fish counter", "చేపల జాబితాకు వెళ్ళండి")}
        <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}

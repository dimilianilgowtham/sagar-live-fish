"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Fish,
  MessageCircle,
} from "lucide-react";
import { whatsappUrl } from "@/lib/store";
import { useStore } from "./store-provider";
import { FishMark } from "./site-shell";
import { ProductCard } from "./product-card";
import { ShopCallout } from "./page-intro";
import { OrderSteps } from "./store-sections";
import BrandLogo from "./brand-logo";

export default function Storefront() {
  const { t, language, products, chooseProduct } = useStore();
  const te = language === "te";
  const contactUrl = whatsappUrl(
    t(
      "Hello Sagar Live Fish! I’d like to know about your fresh catch.",
      "నమస్కారం! తాజా చేపల వివరాలు చెప్పండి.",
    ),
  );
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-photo">
          <Image
            src="/images/hero.webp"
            alt={t(
              "Fresh whole fish, prawns and crab on ice with lime and herbs",
              "మంచుపై తాజా చేపలు, రొయ్యలు, పీతలు",
            )}
            fill
            sizes="(max-width: 760px) 100vw, 60vw"
            preload
          />
          <div className="hero-photo-shade" />
        </div>
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              <span />
              {t("YOUR NEIGHBOURHOOD FISH MARKET", "మీ ఇంటి రుచికి తాజా చేపలు")}
            </p>
            <BrandLogo
              className="hero-brand"
              variant="wordmark"
              sizes="(max-width: 760px) 118vw, 563px"
              preload
            />
            <h1 id="hero-title">
              {te ? (
                <>
                  తాజా చేపలు.
                  <br />
                  <em>అసలైన రుచి.</em>
                </>
              ) : (
                <>
                  Fresh catch.
                  <br />
                  <em>Real flavour.</em>
                </>
              )}
            </h1>
            <p className="hero-description">
              {t(
                "Good meals begin with good ingredients. Discover freshwater favourites and sea treasures, cleaned and cut just the way you like.",
                "మంచి వంటకు తాజా పదార్థాలే మొదటి మెట్టు. తీపి నీటి చేపలు, సముద్రపు చేపలు — మీకు నచ్చిన విధంగా శుభ్రం చేసి, కట్ చేసి అందిస్తాం.",
              )}
            </p>
            <div className="hero-actions">
              <Link className="button button-brand" href="/shop">
                {t("Shop today’s catch", "తాజా చేపలు ఎంచుకోండి")}
                <ArrowUpRight size={19} />
              </Link>
              <a
                className="hero-contact"
                href={contactUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={19} />
                {t("Talk to us", "మాట్లాడండి")}
              </a>
            </div>
            <div className="hero-bottom-note">
              <span className="small-line" />
              <span>
                {t(
                  "Freshwater. Sea catch. A little something for everyone.",
                  "చేపలు. రొయ్యలు. పీతలు. అందరి కోసం తాజా రుచులు.",
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="hero-photo-caption">
          <span className="caption-circle">
            <Fish size={23} strokeWidth={1.4} />
          </span>
          <div>
            {t("FROM WATER TO WONDER", "తాజాదనమే మా ప్రత్యేకత")}
            <span>
              {t(
                "A fresh start to something delicious.",
                "రుచికరమైన భోజనానికి తాజా ఆరంభం.",
              )}
            </span>
          </div>
        </div>
        <span className="hero-index" aria-hidden="true">
          01 — THE FRESHER SIDE
        </span>
      </section>
      <div className="assurance-bar">
        <div className="container assurance-inner">
          {[
            { en: "Cleaned & cut your way", te: "మీకు నచ్చిన కట్స్" },
            {
              en: "Clear weights. Honest prices.",
              te: "స్పష్టమైన బరువు, ధరలు",
            },
            {
              en: "Order directly on WhatsApp",
              te: "WhatsAppలో నేరుగా ఆర్డర్",
            },
          ].map((item) => (
            <span key={item.en}>
              <Check size={16} />
              {te ? item.te : item.en}
            </span>
          ))}
        </div>
      </div>
      <section className="home-categories section-padding">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {t("FOLLOW YOUR APPETITE", "మీకు నచ్చిన రుచులు")}
              </p>
              <h2>
                {t("Three waters. ", "మూడు రకాలు. ")}
                <em>{t("Endless possibilities.", "ఎన్నో రుచులు.")}</em>
              </h2>
            </div>
            <p>
              {t(
                "A comforting curry. A Sunday fry.\nStart with what you love.",
                "రోజువారీ కూరకైనా, ఆదివారం వేపుడుకైనా. మీకు నచ్చిన రకంతో మొదలుపెట్టండి.",
              )}
            </p>
          </div>
          <div className="category-discovery-grid">
            {[
              {
                id: "freshwater",
                image: "catla",
                en: "Freshwater favourites",
                te: "తీపి నీటి చేపలు",
                note: "FOR THE COMFORTING CLASSICS",
              },
              {
                id: "marine",
                image: "tuna",
                en: "Treasures from the sea",
                te: "సముద్రపు రుచులు",
                note: "A LITTLE TASTE OF THE COAST",
              },
              {
                id: "shellfish",
                image: "prawns",
                en: "Prawns, crabs & company",
                te: "రొయ్యలు & పీతలు",
                note: "MAKE IT A SPECIAL OCCASION",
              },
            ].map((category, index) => (
              <Link
                className="category-discovery"
                href={`/shop?category=${category.id}`}
                key={category.id}
              >
                <Image
                  src={`/images/${category.image}.webp`}
                  alt=""
                  fill
                  sizes="(max-width:760px) 90vw, 31vw"
                />
                <div className="category-discovery-shade" />
                <span className="category-discovery-index">
                  0{index + 1} /{" "}
                  {
                    products.filter(
                      (product) => product.category === category.id,
                    ).length
                  }{" "}
                  {t("VARIETIES", "రకాలు")}
                </span>
                <div className="category-discovery-copy">
                  <p>{t(category.note, "మీ వంటకు తాజా ఎంపిక")}</p>
                  <h3>{te ? category.te : category.en}</h3>
                  <span>
                    {t("Explore the catch", "చేపలు చూడండి")}
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="home-featured section-padding">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {t("FROM OUR COUNTER", "మా తాజా ఎంపిక")}
              </p>
              <h2>
                {t("Good things ", "మీ కోసం ")}
                <em>{t("on the menu.", "తాజా రుచులు.")}</em>
              </h2>
            </div>
            <Link className="text-link" href="/shop">
              {t("View the full catch", "అన్ని చేపలు చూడండి")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="product-grid">
            {products
              .filter((product) => product.isAvailable)
              .slice(0, 4)
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  language={language}
                  onChoose={chooseProduct}
                />
              ))}
          </div>
          {!products.some((product) => product.isAvailable) && (
            <p className="home-empty">
              {t(
                "Ask us about the next fresh catch. We’re a message away.",
                "తదుపరి తాజా చేపల కోసం మాకు మెసేజ్ చేయండి.",
              )}
            </p>
          )}
          <p className="home-image-note">
            {t(
              "Images are illustrative. Daily rates and availability are confirmed by the shop.",
              "చిత్రాలు సూచన కోసం మాత్రమే. ధరలు, లభ్యతను షాప్ నిర్ధారిస్తుంది.",
            )}
          </p>
        </div>
      </section>
      <OrderSteps />{" "}
      <section
        id="our-promise"
        className="promise-section section-padding"
        aria-labelledby="promise-title"
      >
        <div className="container promise-grid">
          <div className="promise-art">
            <Image
              src="/images/prawns.webp"
              alt={t(
                "Fresh prawns with lime on a bed of ice",
                "మంచుపై తాజా రొయ్యలు",
              )}
              fill
              sizes="(max-width: 760px) 95vw, 45vw"
            />
            <div className="promise-image-label">
              <FishMark />
              <span>
                {t("GOOD CATCH. GOOD COMPANY.", "తాజా చేపలు. మన ఇంటి రుచి.")}
              </span>
            </div>
          </div>
          <div className="promise-copy">
            <p className="eyebrow">{t("THE SAGAR WAY", "సాగర్ ప్రత్యేకత")}</p>
            <h2 id="promise-title">
              {te ? (
                <>
                  కొంచెం శ్రద్ధ.
                  <br />
                  <em>ఎంతో మంచి రుచి.</em>
                </>
              ) : (
                <>
                  A little more care.
                  <br />
                  <em>A lot more flavour.</em>
                </>
              )}
            </h2>
            <p className="promise-intro">
              {t(
                "For a comforting Andhra pulusu, a crispy Sunday fry, or a table full of family — we believe the best part of a meal starts long before the cooking.",
                "ఘుమఘుమలాడే చేపల పులుసు, కరకరలాడే ఆదివారం వేపుడు లేదా కుటుంబ విందు — మంచి భోజనం తాజా చేపలతోనే మొదలవుతుంది.",
              )}
            </p>
            <div className="promise-list">
              {[
                {
                  en: "Prepared for your recipe",
                  te: "మీ వంటకానికి సరైన కట్స్",
                  enDetail: "Thoughtfully cleaned and cut to your preference.",
                  teDetail: "మీకు నచ్చిన విధంగా శుభ్రం చేసి కట్ చేస్తాం.",
                },
                {
                  en: "Clarity with every order",
                  te: "ప్రతి ఆర్డర్‌లో స్పష్టత",
                  enDetail: "We confirm whole and cleaned weights with you.",
                  teDetail: "మొత్తం బరువు, శుభ్రం చేసిన బరువు నిర్ధారిస్తాం.",
                },
                {
                  en: "Real people, a message away",
                  te: "ఒక్క మెసేజ్‌తో మాతో మాట్లాడండి",
                  enDetail: "Speak directly to the shop. No account needed.",
                  teDetail: "షాప్‌తో నేరుగా మాట్లాడండి. ఖాతా అవసరం లేదు.",
                },
              ].map((item) => (
                <div key={item.en}>
                  <Check size={16} />
                  <div>
                    <h3>{te ? item.te : item.en}</h3>
                    <p>{te ? item.teDetail : item.enDetail}</p>
                  </div>
                </div>
              ))}
            </div>
            <a
              className="inline-link"
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Get to know your fishmonger", "మాతో మాట్లాడండి")}
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>
      <ShopCallout />
    </>
  );
}

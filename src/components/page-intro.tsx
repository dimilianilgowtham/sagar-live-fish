"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { useStore } from "./store-provider";
import { FishMark } from "./site-shell";

export function PageIntro({
  eyebrow,
  title,
  accent,
  description,
  index,
  children,
}: {
  eyebrow: [string, string];
  title: [string, string];
  accent: [string, string];
  description: [string, string];
  index: string;
  children?: React.ReactNode;
}) {
  const { t } = useStore();
  return (
    <section className="page-intro">
      <div className="container">
        <div className="intro-market-mark" aria-hidden="true">
          <span>SAGAR</span>
          <FishMark />
          <span>LIVE FISH</span>
        </div>
        <nav
          className="breadcrumbs"
          aria-label={t("Breadcrumb", "పేజీ మార్గం")}
        >
          <Link href="/">{t("Home", "హోమ్")}</Link>
          <ChevronRight size={12} />
          <span>{t(...eyebrow)}</span>
        </nav>
        <div className="page-intro-grid">
          <div>
            <p className="eyebrow">
              {index} / {t(...eyebrow)}
            </p>
            <h1>
              {t(...title)}
              <br />
              <em>{t(...accent)}</em>
            </h1>
          </div>
          <div className="page-intro-aside">
            <p>{t(...description)}</p>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShopCallout() {
  const { t } = useStore();
  return (
    <section className="shop-callout">
      <div className="container">
        <div>
          <p className="eyebrow">
            {t("SOMETHING GOOD IS WAITING", "మీ కోసం తాజా చేపలు")}
          </p>
          <h2>
            {t("Make room for ", "మీ భోజనానికి ")}
            <em>{t("a good catch.", "తాజా రుచులు.")}</em>
          </h2>
        </div>
        <Link className="button button-navy" href="/shop">
          {t("Visit the fish counter", "మా చేపలు చూడండి")}
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}

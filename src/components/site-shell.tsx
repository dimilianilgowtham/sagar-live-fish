"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Menu,
  MapPin,
  MessageCircle,
  Phone,
  ShoppingBag,
  X,
} from "lucide-react";
import { currency, PHONE, whatsappUrl } from "@/lib/store";
import { useStore } from "./store-provider";
import BrandLogo from "./brand-logo";
import { SHOP_DETAILS } from "@/data/shop";

export function FishMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 24C20 8 41 5 56 24C41 43 20 40 9 24Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M54 24L68 12V36L54 24ZM26 12C35 18 35 30 26 36M9 24H3M34 10L43 5L46 13M34 38L43 43L46 35"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="22" r="2.2" fill="currentColor" />
    </svg>
  );
}
export function Brand({
  footer = false,
  onNavigate,
}: {
  footer?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      className={`brand${footer ? " brand-footer" : ""}`}
      href="/"
      aria-label="Sagar Live Fish home"
      onNavigate={onNavigate}
    >
      <BrandLogo variant={footer ? "full" : "crest"} preload={!footer} />
    </Link>
  );
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const { t, language, setLanguage, basket, openBasket } = useStore();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const dismissOutside = (event: PointerEvent | FocusEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 961px)");
    const dismissOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    desktop.addEventListener("change", dismissOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
      desktop.removeEventListener("change", dismissOnDesktop);
    };
  }, [menuOpen]);
  const links = [
    { href: "/shop", label: t("The fish counter", "మా చేపలు") },
    { href: "/how-to-order", label: t("How to order", "ఆర్డర్ విధానం") },
    { href: "/delivery", label: t("Delivery & FAQ", "డెలివరీ & సందేహాలు") },
    { href: "/contact", label: t("Find us", "సంప్రదించండి") },
  ];
  const active = (href: string) =>
    pathname === href || (href === "/shop" && pathname.startsWith("/fish/"));
  const contact = whatsappUrl(
    t(
      "Hello Sagar Live Fish! I’d like to enquire about your fresh catch.",
      "నమస్కారం! తాజా చేపల గురించి తెలుసుకోవాలనుకుంటున్నాను.",
    ),
  );
  const total = basket.reduce((sum, item) => sum + (item.approxTotal ?? 0), 0);
  const hasPricedItems = basket.some((item) => item.approxTotal !== null);
  const hasUnpricedItems = basket.some((item) => item.approxTotal === null);
  return (
    <div className="site-shell multipage-shell" id="home">
      <a className="skip-link" href="#main-content">
        {t("Skip to content", "విషయానికి వెళ్ళండి")}
      </a>
      <div className="announcement">
        <div className="container announcement-inner">
          <span>
            <span className="status-dot" />
            {t(
              "A good meal starts with a good catch.",
              "మంచి భోజనం తాజా చేపలతోనే మొదలు.",
            )}
          </span>
          <span className="announcement-right">
            {t("RETAIL & WHOLESALE", "రీటైల్ & హోల్సేల్")}
            <span className="announcement-divider" />
            <a href={`tel:+91${PHONE}`}>
              <Phone size={12} />
              {PHONE}
            </a>
          </span>
        </div>
      </div>
      <header className="site-header" ref={headerRef}>
        <div className="container header-inner">
          <Brand onNavigate={() => setMenuOpen(false)} />
          <nav
            className="desktop-nav"
            aria-label={t("Main navigation", "ప్రధాన నావిగేషన్")}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={active(link.href) ? "nav-current" : ""}
                aria-current={active(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="language-button"
              onClick={() => setLanguage(language === "te" ? "en" : "te")}
              aria-label={
                language === "te" ? "Switch to English" : "Switch to Telugu"
              }
            >
              <span lang={language === "te" ? "en" : "te"}>
                {language === "te" ? "English" : "తెలుగు"}
              </span>
              <ChevronDown size={12} />
            </button>
            <span className="header-divider" />
            <button
              className="basket-button"
              aria-label={t(
                `Open basket, ${basket.length} items`,
                `బుట్ట తెరవండి, ${basket.length} వస్తువులు`,
              )}
              onClick={() => {
                setMenuOpen(false);
                openBasket();
              }}
            >
              <ShoppingBag size={19} />
              <span className="basket-label">
                {t("Your basket", "మీ బుట్ట")}
              </span>
              <span className="basket-count">{basket.length}</span>
            </button>
            <button
              ref={menuButtonRef}
              className="icon-button menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? "mobile-menu" : undefined}
              aria-label={
                menuOpen
                  ? t("Close navigation", "మెనూ మూసివేయండి")
                  : t("Open navigation", "మెనూ తెరవండి")
              }
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label={t("Mobile navigation", "మొబైల్ నావిగేషన్")}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/wholesale" onClick={() => setMenuOpen(false)}>
              {t("Wholesale", "హోల్సేల్")}
            </Link>
          </nav>
        )}
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-main">
            <div>
              <Brand footer />
              <p>
                {t(
                  "Fresh catch. Honest care.\nGood food for your table.",
                  "తాజా చేపలు. నమ్మకమైన సేవ.\nమీ ఇంటికి మంచి రుచులు.",
                )}
              </p>
            </div>
            <nav
              className="footer-links"
              aria-label={t("Useful pages", "ఉపయోగకరమైన పేజీలు")}
            >
              <Link href="/shop">
                {t("Shop all seafood", "అన్ని చేపలు చూడండి")}
              </Link>
              <Link href="/how-to-order">
                {t("How to order", "ఆర్డర్ విధానం")}
              </Link>
              <Link href="/delivery">
                {t("Delivery & FAQ", "డెలివరీ & సందేహాలు")}
              </Link>
              <Link href="/wholesale">
                {t("Wholesale enquiries", "హోల్సేల్ విచారణ")}
              </Link>
              <Link href="/contact">
                {t("Find our shop", "మా షాప్ చిరునామా")}
              </Link>
            </nav>
            <div className="footer-contact">
              <a href={SHOP_DETAILS.location.directionsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin size={17} />
                {t("Gandhi Bomma Centre, Vadlapudi", "గాంధీ బొమ్మ సెంటర్, వడ్లపూడి")}
              </a>
              <span>
                {t(
                  "REAL PEOPLE. GOOD CONVERSATIONS.",
                  "మాతో నేరుగా మాట్లాడండి",
                )}
              </span>
              <a href={contact} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} />
                {t("Talk to us on WhatsApp", "WhatsAppలో మాట్లాడండి")}
                <ArrowUpRight size={16} />
              </a>
              <a href={`tel:+91${PHONE}`}>
                <Phone size={15} />
                +91 {PHONE}
              </a>
              <p className="footer-order-note">
                {t(
                  "Every enquiry is confirmed personally by the shop.",
                  "ప్రతి ఆర్డర్ వివరాలను షాప్ నేరుగా నిర్ధారిస్తుంది.",
                )}
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © 2026 Sagar Live Fish.{" "}
              {t(
                "A little more care. A lot more flavour.",
                "కొంచెం శ్రద్ధ. ఎంతో మంచి రుచి.",
              )}
            </span>
            <div>
              <Link href="/admin">{t("Owner sign in", "యజమాని లాగిన్")}</Link>
              <Link href="/contact">
                {t("Get in touch", "సంప్రదించండి")}
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </footer>
      {basket.length > 0 && (
        <div className="floating-basket">
          <button onClick={openBasket}>
            <span className="floating-basket-icon">
              <ShoppingBag size={18} />
              <span>{basket.length}</span>
            </span>
            <span>
              {t("Your fresh catch", "మీ తాజా చేపలు")}
              <small>{t("View basket", "బుట్ట చూడండి")}</small>
            </span>
            <strong
              className={hasPricedItems ? undefined : "basket-price-request"}
            >
              {hasPricedItems
                ? `${currency(total)}${hasUnpricedItems ? "+" : ""}`
                : t("Ask for price", "ధర అడగండి")}
            </strong>
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

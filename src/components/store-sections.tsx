"use client";

import {
  Fish,
  SlidersHorizontal,
  MessageCircle,
  ArrowUpRight,
  Waves,
} from "lucide-react";
import { useStore } from "./store-provider";
import { FishMark } from "./site-shell";

export function OrderSteps() {
  const { t, language } = useStore();
  const te = language === "te";
  return (
    <section
      id="how-it-works"
      className="how-section section-padding"
      aria-labelledby="how-title"
    >
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              {t("FRESH MADE SIMPLE", "తాజా చేపలు, సులభమైన ఆర్డర్")}
            </p>
            <h2 id="how-title">
              {te ? (
                <>
                  మా షాప్ నుండి
                  <br />
                  <em>మీ వంటింటికి.</em>
                </>
              ) : (
                <>
                  From our counter
                  <br />
                  <em>to your kitchen.</em>
                </>
              )}
            </h2>
          </div>
          <p>
            {t(
              "A few simple choices. A real conversation.\nThat’s all it takes to bring home a good catch.",
              "కొన్ని సులభమైన ఎంపికలు. నేరుగా మాతో మాటలు.\nతాజా చేపలను ఇంటికి తీసుకెళ్ళడం అంతే సులభం.",
            )}
          </p>
        </div>
        <div className="steps-grid">
          {[
            {
              number: "01",
              icon: Fish,
              title: t(
                "Find your fresh favourite",
                "మీకు నచ్చిన చేపను ఎంచుకోండి",
              ),
              description: t(
                "Browse the catch, from familiar freshwater fish to prawns, crabs and sea specials.",
                "తీపి నీటి చేపల నుండి రొయ్యలు, పీతలు, సముద్రపు చేపల వరకు ఎంచుకోండి.",
              ),
            },
            {
              number: "02",
              icon: SlidersHorizontal,
              title: t("Make it your own", "మీకు నచ్చిన విధంగా"),
              description: t(
                "Curry cut, fry slices or whole cleaned. Pick your preparation and how much you need.",
                "కూర ముక్కలు, వేపుడు ముక్కలు లేదా మొత్తం చేప. కట్, పరిమాణం ఎంచుకోండి.",
              ),
            },
            {
              number: "03",
              icon: MessageCircle,
              title: t("Let’s talk on WhatsApp", "WhatsAppలో మాట్లాడుకుందాం"),
              description: t(
                "Send your basket. We’ll confirm the catch, price and pickup or delivery options with you.",
                "మీ బుట్టను పంపండి. చేపల లభ్యత, ధర, పికప్ లేదా డెలివరీ వివరాలు నిర్ధారిస్తాం.",
              ),
            },
          ].map(({ number, icon: Icon, title, description }) => (
            <div className="step" key={number}>
              <div className="step-top">
                <span>{number}</span>
                <Icon size={25} strokeWidth={1.3} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WholesaleBanner() {
  const { t, language, openWholesale } = useStore();
  const te = language === "te";
  return (
    <section
      id="wholesale"
      className="wholesale-section"
      aria-labelledby="wholesale-title"
    >
      <div className="container">
        <div className="wholesale-banner">
          <div className="wholesale-pattern" aria-hidden="true">
            <FishMark />
            <Waves size={150} strokeWidth={0.5} />
          </div>
          <div className="wholesale-copy">
            <p className="eyebrow">
              {t(
                "FOR BIGGER TABLES & BIGGER PLANS",
                "పెద్ద విందులకు, ప్రత్యేక వేడుకలకు",
              )}
            </p>
            <h2 id="wholesale-title">
              {te ? (
                <>
                  పెద్ద ఆర్డర్?
                  <br />
                  <em>మాతో మాట్లాడండి.</em>
                </>
              ) : (
                <>
                  Big occasion?
                  <br />
                  <em>We’ve got the catch.</em>
                </>
              )}
            </h2>
            <p>
              {t(
                "Restaurants, caterers, celebrations. Let’s find the right catch, cuts and quantities for your next big thing.",
                "హోటళ్ళు, క్యాటరింగ్, వేడుకలు. మీ అవసరానికి సరైన చేపలు, కట్స్, పరిమాణాల కోసం మాతో మాట్లాడండి.",
              )}
            </p>
          </div>
          <div className="wholesale-cta">
            <button className="button button-aqua" onClick={openWholesale}>
              {t("Talk wholesale", "హోల్సేల్ కోసం సంప్రదించండి")}
              <ArrowUpRight size={19} />
            </button>
            <span>
              {t("From 10 kg to full crates.", "10 కిలోల నుండి క్రేట్ల వరకు.")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

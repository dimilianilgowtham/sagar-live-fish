"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Fish,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { PHONE, whatsappUrl } from "@/lib/store";
import { useStore } from "./store-provider";
import { PageIntro, ShopCallout } from "./page-intro";
import { DeliveryFaq, ShopContactDetails } from "./shop-information";
import { OrderSteps, WholesaleBanner } from "./store-sections";
import ShopMap from "./shop-map";

export function DeliveryPage() {
  const { language, t } = useStore();
  return (
    <>
      <PageIntro
        index="03"
        eyebrow={["DELIVERY & YOUR QUESTIONS", "డెలివరీ & మీ సందేహాలు"]}
        title={["From our counter.", "మా షాప్ నుండి."]}
        accent={["On your terms.", "మీకు నచ్చిన విధంగా."]}
        description={[
          "A little clarity makes a better order. Talk to the shop about your area, timing and the details that matter.",
          "ఆర్డర్ ముందు మీ ప్రాంతం, సమయం, ముఖ్యమైన వివరాలను షాప్‌తో చర్చించండి.",
        ]}
      >
        <Link href="/how-to-order" className="text-link">
          {t("New here? See how to order", "ఆర్డర్ విధానం చూడండి")}
          <ArrowUpRight size={16} />
        </Link>
      </PageIntro>
      <div className="dedicated-delivery">
        <DeliveryFaq language={language} />
      </div>
      <ShopCallout />
    </>
  );
}

export function ContactPage() {
  const { t, language } = useStore();
  const contact = whatsappUrl(
    t(
      "Hello Sagar Live Fish! I’d like to know about your catch and shop details.",
      "నమస్కారం! మీ చేపలు, షాప్ వివరాలు తెలుసుకోవాలనుకుంటున్నాను.",
    ),
  );
  return (
    <>
      <PageIntro
        index="04"
        eyebrow={["YOUR NEIGHBOURHOOD FISHMONGER", "మీ దగ్గరలోని చేపల షాప్"]}
        title={["Good food.", "తాజా రుచులు."]}
        accent={["A real conversation.", "నేరుగా మాట్లాడండి."]}
        description={[
          "A question about the catch, a special cut, or a bigger table? We’re a call or a message away.",
          "చేపల గురించి సందేహమా, ప్రత్యేక కట్ కావాలా, పెద్ద ఆర్డరా? కాల్ లేదా మెసేజ్ చేయండి.",
        ]}
      />
      <section className="contact-page-body section-padding">
        <div className="container contact-page-grid">
          <div className="contact-editorial-photo">
            <Image
              src="/images/hero.webp"
              alt={t(
                "An illustrative selection of fresh seafood on ice",
                "మంచుపై తాజా చేపల సూచన చిత్రం",
              )}
              fill
              sizes="(max-width:760px) 94vw, 47vw"
            />
            <div>
              <Fish size={24} strokeWidth={1.3} />
              <span>
                {t("GOOD CATCH. GOOD COMPANY.", "తాజా చేపలు. మన ఇంటి రుచి.")}
              </span>
            </div>
          </div>
          <div className="contact-page-copy">
            <p className="eyebrow">
              {t("LET’S TALK FISH", "చేపల గురించి మాట్లాడుకుందాం")}
            </p>
            <h2>
              {t("Your next good meal ", "మీ తదుపరి వంటకం ")}
              <em>{t("starts here.", "ఇక్కడే మొదలు.")}</em>
            </h2>
            <a className="contact-phone" href={`tel:+91${PHONE}`}>
              <span>{t("CALL THE SHOP", "షాప్‌కు కాల్ చేయండి")}</span>+91{" "}
              {PHONE}
              <ArrowUpRight size={24} />
            </a>
            <a
              className="button button-navy"
              href={contact}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={18} />
              {t("Message on WhatsApp", "WhatsAppలో మెసేజ్ చేయండి")}
              <ArrowUpRight size={17} />
            </a>
            <p className="contact-visit-note">
              <MapPin size={16} />
              {t(
                "Visit us at Gandhi Bomma Centre, Vadlapudi. Call to check today’s hours before you travel.",
                "వడ్లపూడి గాంధీ బొమ్మ సెంటర్‌లో మా షాప్‌కు రండి. బయలుదేరే ముందు ఈరోజు పని వేళల కోసం కాల్ చేయండి.",
              )}
            </p>
          </div>
        </div>
        <ShopContactDetails language={language} />
        <ShopMap language={language} />
      </section>
      <div className="container contact-wholesale-note">
        <Phone size={18} />
        <p>
          {t(
            "Shopping for a restaurant, catering or a celebration?",
            "హోటల్, క్యాటరింగ్ లేదా వేడుక కోసం కొనుగోలు చేస్తున్నారా?",
          )}
        </p>
        <Link href="/wholesale">
          {t("Meet our wholesale counter", "హోల్సేల్ వివరాలు చూడండి")}
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </>
  );
}

export function OrderingPage() {
  const { t } = useStore();
  return (
    <>
      <PageIntro
        index="02"
        eyebrow={["HOW TO ORDER", "ఆర్డర్ విధానం"]}
        title={["Your fish.", "మీ చేపలు."]}
        accent={["Your way.", "మీకు నచ్చిన విధంగా."]}
        description={[
          "Choose a catch. Pick a cut. Have a conversation. Bringing something good to the table should feel this simple.",
          "చేపను ఎంచుకోండి. కట్ ఎంచుకోండి. మాతో మాట్లాడండి. మీ భోజనానికి తాజా రుచులు సులభంగా.",
        ]}
      />
      <OrderSteps />
      <section className="container ordering-note">
        <ShieldCheck size={28} strokeWidth={1.4} />
        <div>
          <h2>
            {t(
              "A basket starts the conversation.",
              "బుట్టతో ఆర్డర్ విచారణ మొదలవుతుంది.",
            )}
          </h2>
          <p>
            {t(
              "Sending your basket on WhatsApp is an enquiry. The shop confirms availability, whole and cleaned weight, final price, payment and delivery or pickup before preparing your order.",
              "WhatsAppలో బుట్ట పంపడం విచారణ మాత్రమే. సిద్ధం చేసే ముందు చేపల లభ్యత, బరువు, తుది ధర, చెల్లింపు, డెలివరీ లేదా పికప్ వివరాలను షాప్ నిర్ధారిస్తుంది.",
            )}
          </p>
          <Link href="/delivery" className="text-link">
            {t("Read delivery details & FAQs", "డెలివరీ వివరాలు & సందేహాలు")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <ShopCallout />
    </>
  );
}

export function WholesalePage() {
  const { t, openWholesale } = useStore();
  return (
    <>
      <PageIntro
        index="05"
        eyebrow={["THE WHOLESALE COUNTER", "హోల్సేల్ చేపలు"]}
        title={["Bigger tables.", "పెద్ద విందులు."]}
        accent={["The same care.", "అదే శ్రద్ధ."]}
        description={[
          "For restaurants, caterers and celebrations. Let’s plan the varieties, preparation and quantities that suit your kitchen.",
          "హోటళ్ళు, క్యాటరింగ్, వేడుకల కోసం. మీ వంటకు సరైన చేపలు, కట్స్, పరిమాణాల కోసం మాట్లాడుకుందాం.",
        ]}
      >
        <button onClick={openWholesale} className="button button-aqua">
          {t("Start a wholesale enquiry", "హోల్సేల్ విచారణ చేయండి")}
          <ArrowUpRight size={17} />
        </button>
      </PageIntro>
      <div className="container wholesale-benefits section-padding">
        {[
          [
            "01",
            t("The right varieties", "సరైన చేప రకాలు"),
            t(
              "Tell us your menu and preferred fish. We’ll discuss the available catch with you.",
              "మీ వంటకాలు, చేప రకాలు చెప్పండి. లభ్యమైన చేపల గురించి చర్చిద్దాం.",
            ),
          ],
          [
            "02",
            t("Prepared for your kitchen", "మీ వంటింటికి సరైన కట్స్"),
            t(
              "Agree cuts, cleaning and whole versus prepared weight before your order is confirmed.",
              "ఆర్డర్ ఖరారు చేసే ముందు కట్స్, శుభ్రం చేయడం, బరువు వివరాలు నిర్ధారించండి.",
            ),
          ],
          [
            "03",
            t("A plan you can count on", "ముందుగానే స్పష్టమైన ప్రణాళిక"),
            t(
              "Confirm quantity, current rates and pickup or delivery arrangements directly with the shop.",
              "పరిమాణం, ప్రస్తుత ధరలు, పికప్ లేదా డెలివరీ వివరాలను షాప్‌తో నిర్ధారించండి.",
            ),
          ],
        ].map(([index, title, description]) => (
          <article key={index}>
            <span>{index}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <WholesaleBanner />
      <ShopCallout />
    </>
  );
}

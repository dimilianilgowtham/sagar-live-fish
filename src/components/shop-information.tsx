"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Clock3,
  MapPin,
  MessageCircle,
  Plus,
  Truck,
} from "lucide-react";
import { SHOP_DETAILS } from "@/data/shop";
import { buildDeliveryMessage, WHATSAPP_PHONE, whatsappUrl } from "@/lib/store";

type Language = "en" | "te";

export function DeliveryFaq({ language }: { language: Language }) {
  const [area, setArea] = useState("");
  const te = language === "te";
  const t = (en: string, telugu: string) => (te ? telugu : en);
  const questions = [
    {
      question: t("How do I place an order?", "ఆర్డర్ ఎలా చేయాలి?"),
      answer: t(
        "Choose your fish, cut and quantity, then add them to your basket. Send your basket on WhatsApp. Your order is confirmed only when the shop replies and agrees the details with you.",
        "మీకు నచ్చిన చేప, కట్, పరిమాణం ఎంచుకుని బుట్టలో చేర్చండి. బుట్టను WhatsAppలో పంపండి. షాప్ స్పందించి వివరాలను నిర్ధారించిన తర్వాతే ఆర్డర్ ఖరారవుతుంది.",
      ),
    },
    {
      question: t("Do you deliver to my area?", "మా ప్రాంతానికి డెలివరీ ఉందా?"),
      answer: SHOP_DETAILS.deliveryAreas
        ? `${SHOP_DETAILS.deliveryAreas[language]} ${t("Ask the shop to confirm charges, minimum order and a suitable time before ordering.", "ఆర్డర్ చేసే ముందు ఛార్జీలు, కనీస ఆర్డర్, సమయాన్ని షాప్‌తో నిర్ధారించండి.")}`
        : t(
            "Share your area or PIN code using the enquiry form. The shop will confirm whether delivery is available, along with any charges, minimum order and timing before you order.",
            "విచారణ ఫారమ్‌లో మీ ప్రాంతం లేదా పిన్ కోడ్ ఇవ్వండి. ఆర్డర్ చేసే ముందు డెలివరీ లభ్యత, ఛార్జీలు, కనీస ఆర్డర్, సమయాన్ని షాప్ నిర్ధారిస్తుంది.",
          ),
    },
    {
      question: t("Is the price in my basket final?", "బుట్టలో చూపిన ధర తుది ధరేనా?"),
      answer: t(
        "Basket totals are estimates based on the listed price per kg and your chosen weight. Availability, daily rates and whole versus cleaned weight can affect the final amount. The shop confirms the final price before preparing your order.",
        "బుట్టలోని మొత్తం కిలో ధర, మీరు ఎంచుకున్న బరువు ఆధారంగా అంచనా మాత్రమే. లభ్యత, రోజువారీ ధరలు, శుభ్రం చేసే ముందు మరియు తర్వాత బరువుతో తుది మొత్తం మారవచ్చు. సిద్ధం చేసే ముందు షాప్ తుది ధరను నిర్ధారిస్తుంది.",
      ),
    },
    {
      question: t("Can I choose how my fish is cut?", "నాకు నచ్చిన విధంగా కట్ చేస్తారా?"),
      answer: t(
        "Yes. Each product lists its preparation options, such as curry cut, fry slices or whole cleaned. Choose an option before adding it to your basket. Ask the shop about special requests and any preparation charges.",
        "అవును. ప్రతి చేపకు కూర ముక్కలు, వేపుడు ముక్కలు లేదా శుభ్రం చేసిన మొత్తం చేప వంటి ఎంపికలు ఉంటాయి. బుట్టలో చేర్చే ముందు కట్ ఎంచుకోండి. ప్రత్యేక అవసరాలు, శుభ్రం చేసే ఛార్జీల గురించి షాప్‌ను అడగండి.",
      ),
    },
    {
      question: t("Can I collect my order?", "నా ఆర్డర్‌ను షాప్‌లో తీసుకోవచ్చా?"),
      answer: t(
        "Ask for pickup when you send your basket. Confirm the shop location, opening hours and collection time with us before travelling.",
        "బుట్ట పంపేటప్పుడు షాప్‌లో తీసుకుంటామని చెప్పండి. బయలుదేరే ముందు షాప్ చిరునామా, పని వేళలు, తీసుకునే సమయం నిర్ధారించుకోండి.",
      ),
    },
    {
      question: t("When and how do I pay?", "చెల్లింపు ఎప్పుడు, ఎలా చేయాలి?"),
      answer: t(
        "The shop will confirm accepted payment methods and when to pay on WhatsApp. Sending a basket is an enquiry; it does not take a payment on this website.",
        "చెల్లింపు పద్ధతులు, ఎప్పుడు చెల్లించాలో షాప్ WhatsAppలో తెలియజేస్తుంది. బుట్ట పంపడం విచారణ మాత్రమే; ఈ వెబ్‌సైట్‌లో చెల్లింపు తీసుకోము.",
      ),
    },
  ];

  return (
    <section
      id="delivery"
      className="delivery-section section-padding"
      aria-labelledby="delivery-title"
    >
      <div className="container">
        <div className="section-heading delivery-heading">
          <div>
            <p className="eyebrow">
              {t("A LITTLE CLARITY, BEFORE YOU COOK", "ఆర్డర్ ముందు మీ సందేహాలకు సమాధానాలు")}
            </p>
            <h2 id="delivery-title">
              {te ? <>మీ ప్రశ్నలు. <em>మా సమాధానాలు.</em></> : <>Good catch. <em>No guesswork.</em></>}
            </h2>
          </div>
          <p>
            {t(
              "From your first question to your final cut.\nHere’s what to know before you order.",
              "మీ మొదటి సందేహం నుండి మీకు నచ్చిన కట్ వరకు.\nఆర్డర్ ముందు తెలుసుకోవాల్సిన వివరాలు.",
            )}
          </p>
        </div>
        <div className="delivery-grid">
          <div className="delivery-card">
            <div className="delivery-card-top">
              <span className="delivery-icon"><Truck size={26} strokeWidth={1.4} /></span>
              <span>{t("LET’S PLAN YOUR ORDER", "మీ ఆర్డర్ గురించి మాట్లాడుకుందాం")}</span>
            </div>
            <h3>{t("A fresh catch,\na little closer.", "తాజా చేపలు,\nమీకు మరింత చేరువగా.")}</h3>
            <p>
              {t(
                "Tell us where you are. We’ll talk through delivery or pickup with you on WhatsApp.",
                "మీ ప్రాంతం చెప్పండి. డెలివరీ లేదా పికప్ వివరాలను WhatsAppలో చర్చిద్దాం.",
              )}
            </p>
            <ul className="delivery-checklist">
              <li><Check size={16} />{t("Confirm service in your area", "మీ ప్రాంతంలో డెలివరీ నిర్ధారణ")}</li>
              <li><Check size={16} />{t("Agree charges & a suitable time", "ఛార్జీలు, అనుకూల సమయం నిర్ధారణ")}</li>
              <li><Check size={16} />{t("Or arrange collection from the shop", "లేదా షాప్‌లో పికప్ ఏర్పాటు")}</li>
            </ul>
            {SHOP_DETAILS.deliveryTerms && <p className="delivery-terms">{SHOP_DETAILS.deliveryTerms[language]}</p>}
            <form
              className="delivery-form"
              action={`https://wa.me/${WHATSAPP_PHONE}`}
              method="get"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("Delivery enquiry", "డెలివరీ విచారణ")}
            >
              <label htmlFor="delivery-area">{t("Your area or PIN code", "మీ ప్రాంతం లేదా పిన్ కోడ్")}</label>
              <div className="delivery-area-input">
                <MapPin size={17} aria-hidden="true" />
                <input
                  id="delivery-area"
                  type="text"
                  autoComplete="address-level2"
                  placeholder={t("Enter area or PIN code", "ప్రాంతం లేదా పిన్ కోడ్ ఇవ్వండి")}
                  required
                  minLength={2}
                  maxLength={100}
                  pattern={".*\\S.*"}
                  title={t("Enter your area or PIN code", "మీ ప్రాంతం లేదా పిన్ కోడ్ ఇవ్వండి")}
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  aria-describedby="delivery-form-note"
                />
              </div>
              <input type="hidden" name="text" value={buildDeliveryMessage(area, language)} />
              <button type="submit" className="button button-aqua button-full">
                <MessageCircle size={18} />
                {t("Ask about delivery", "డెలివరీ గురించి అడగండి")}
                <ArrowUpRight size={18} />
              </button>
              <p id="delivery-form-note">
                {t("Opens a WhatsApp draft. Send it when you’re ready.", "WhatsAppలో మెసేజ్ సిద్ధమవుతుంది. మీరు సిద్ధమైనప్పుడు పంపండి.")}
              </p>
            </form>
          </div>
          <div className="faq-list" aria-label={t("Frequently asked questions", "తరచుగా అడిగే ప్రశ్నలు")}>
            <p className="eyebrow">{t("BEFORE YOU ORDER", "ఆర్డర్ చేసే ముందు")}</p>
            {questions.map(({ question, answer }, index) => (
              <details className="faq-item" key={index} name="ordering-faq">
                <summary>
                  <span className="faq-number" aria-hidden="true">0{index + 1}</span>
                  <span>{question}</span>
                  <Plus size={18} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
            <a className="faq-help" href={whatsappUrl(t("Hello Sagar Live Fish! I have a question before placing an order.", "నమస్కారం! ఆర్డర్ చేసే ముందు ఒక సందేహం ఉంది."))} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={17} />
              {t("Something else on your mind? Talk to us.", "ఇంకేమైనా సందేహమా? మాతో మాట్లాడండి.")}
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShopContactDetails({ language }: { language: Language }) {
  const te = language === "te";
  const t = (en: string, telugu: string) => (te ? telugu : en);
  const details = [
    {
      icon: MapPin,
      title: t("Find our shop", "మా షాప్ చిరునామా"),
      value: SHOP_DETAILS.address?.[language],
      action: t("Get directions", "దారి చూడండి"),
      href: SHOP_DETAILS.location.directionsUrl,
      message: t("Hello Sagar Live Fish! Please share your shop address and directions for pickup.", "నమస్కారం! పికప్ కోసం మీ షాప్ చిరునామా, దారి వివరాలు పంపండి."),
    },
    {
      icon: Clock3,
      title: t("Plan your visit", "మీ రాకకు ముందు"),
      value: SHOP_DETAILS.openingHours?.[language],
      action: t("Check today’s opening hours", "ఈరోజు పని వేళలు అడగండి"),
      message: t("Hello Sagar Live Fish! What are your opening hours today? I’d like to arrange a visit.", "నమస్కారం! ఈరోజు మీ షాప్ పని వేళలు ఏమిటి? షాప్‌కు రావాలనుకుంటున్నాను."),
    },
    {
      icon: Truck,
      title: t("Delivery & pickup", "డెలివరీ & పికప్"),
      value: SHOP_DETAILS.deliveryAreas?.[language],
      action: t("Enquire about your area", "మీ ప్రాంతం గురించి అడగండి"),
      message: buildDeliveryMessage("", language),
    },
  ];
  return (
    <div className="container shop-details">
      {details.map(({ icon: Icon, title, value, action, message, href }) => (
        <div className="shop-detail" key={title}>
          <Icon size={21} strokeWidth={1.4} aria-hidden="true" />
          <div>
            <h3>{title}</h3>
            {value && <p>{value}</p>}
            <a href={href ?? whatsappUrl(message)} target="_blank" rel="noopener noreferrer">
              {action}<ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

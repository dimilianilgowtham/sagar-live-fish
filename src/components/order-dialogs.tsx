"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { Dialog } from "./dialog";
import { ProductOrderForm } from "./product-order-form";
import type { BasketItem, Product } from "@/types";
import {
  buildOrderMessage,
  buildWholesaleMessage,
  currency,
  whatsappUrl,
} from "@/lib/store";

type Language = "en" | "te";

export function CutDialog({
  product,
  language,
  onClose,
  onAdd,
}: {
  product: Product;
  language: Language;
  onClose: () => void;
  onAdd: (item: BasketItem) => void;
}) {
  return (
    <Dialog
      title={language === "te" ? product.nameTe : product.nameEn}
      eyebrow={language === "te" ? "మీకు నచ్చిన విధంగా" : "Prepared your way"}
      closeLabel={language === "te" ? "మూసివేయండి" : "Close dialog"}
      onClose={onClose}
    >
      <ProductOrderForm product={product} language={language} onAdd={onAdd} />
    </Dialog>
  );
}

export function BasketDialog({
  basket,
  language,
  onClose,
  onRemove,
  onClear,
  onBrowse,
}: {
  basket: BasketItem[];
  language: Language;
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onBrowse?: () => void;
}) {
  const te = language === "te";
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const total = basket.reduce((sum, item) => sum + (item.approxTotal ?? 0), 0);
  const hasUnpriced = basket.some((item) => item.approxTotal === null);
  const hasPriced = basket.some((item) => item.approxTotal !== null);
  return (
    <Dialog
      title={te ? "మీ బుట్ట" : "Your fresh catch"}
      eyebrow={te ? "దాదాపు సిద్ధం" : "A good meal starts here"}
      closeLabel={te ? "మూసివేయండి" : "Close dialog"}
      onClose={onClose}
    >
      {basket.length === 0 ? (
        <div className="empty-basket">
          <ShoppingBag size={42} strokeWidth={1} />
          <h3>{te ? "మీ బుట్ట ఖాళీగా ఉంది" : "Something fresh is waiting."}</h3>
          <p>
            {te
              ? "మా చేపలను చూసి మీకు నచ్చినవి ఎంచుకోండి."
              : "Explore the catch and choose something delicious for your table."}
          </p>
          <button className="button button-navy" onClick={onBrowse || onClose}>
            {te ? "చేపలను చూడండి" : "Explore the catch"}
            <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className="basket-items">
            {basket.map((item) => (
              <div className="basket-item" key={item.id}>
                <div className="basket-thumbnail">
                  <Image
                    src={item.image || `/images/${item.productId}.webp`}
                    alt=""
                    fill
                    sizes="68px"
                  />
                </div>
                <div className="basket-item-details">
                  <h3>{te ? item.nameTe : item.nameEn}</h3>
                  <p>
                    {item.weightKg} kg · {item.cut}
                  </p>
                  <strong>
                    {item.approxTotal === null
                      ? te
                        ? "ధర అడగండి"
                        : "Price on request"
                      : currency(item.approxTotal)}
                  </strong>
                </div>
                <button
                  className="icon-button remove-item"
                  aria-label={
                    te ? `${item.nameTe} తొలగించండి` : `Remove ${item.nameEn}`
                  }
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
          <div className="basket-customer">
            <label htmlFor="customer-name">
              {te ? "మీ పేరు (ఐచ్ఛికం)" : "Your name (optional)"}
            </label>
            <input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder={
                te ? "మిమ్మల్ని ఏమని పిలవాలి?" : "What should we call you?"
              }
              maxLength={100}
            />
            <label htmlFor="customer-area">
              {te ? "మీ ప్రాంతం / పికప్" : "Your area / pickup preference"}
            </label>
            <input
              id="customer-area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              autoComplete="address-level2"
              placeholder={
                te
                  ? "మీ ప్రాంతం లేదా షాప్ పికప్"
                  : "Your neighbourhood, or store pickup"
              }
              maxLength={200}
            />
          </div>
          <div className="estimate-row">
            <span>{te ? "అంచనా మొత్తం" : "Estimated subtotal"}</span>
            <strong>
              {hasPriced
                ? currency(total)
                : te
                  ? "ధర అడగండి"
                  : "Price on request"}
              {hasPriced && hasUnpriced && (
                <small> + {te ? "ధర లేని వస్తువులు" : "unpriced items"}</small>
              )}
            </strong>
          </div>
          <p className="form-note">
            {te
              ? "ఇది ఆర్డర్ విచారణ మాత్రమే. లభ్యత, తుది ధర, డెలివరీ వివరాలు WhatsAppలో నిర్ధారిస్తాం."
              : "This is an enquiry. We’ll confirm availability, final prices and pickup or delivery options with you before preparation."}
          </p>
          <a
            className="button button-whatsapp button-full"
            href={whatsappUrl(buildOrderMessage(basket, name, area))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={19} />
            {te ? "WhatsAppలో కొనసాగించండి" : "Continue on WhatsApp"}
            <ArrowRight size={18} />
          </a>
          <button className="text-button clear-basket" onClick={onClear}>
            {te ? "బుట్ట ఖాళీ చేయండి" : "Empty basket"}
          </button>
        </>
      )}
    </Dialog>
  );
}

export function WholesaleDialog({
  language,
  onClose,
}: {
  language: Language;
  onClose: () => void;
}) {
  const te = language === "te";
  const [business, setBusiness] = useState("");
  const [varieties, setVarieties] = useState("");
  const [quantity, setQuantity] = useState("10–25 kg");
  return (
    <Dialog
      title={
        te ? "పెద్ద ఆర్డర్లకు, అదే నాణ్యత." : "A bigger catch. The same care."
      }
      eyebrow={te ? "హోల్సేల్ విచారణ" : "Wholesale & catering"}
      closeLabel={te ? "మూసివేయండి" : "Close dialog"}
      onClose={onClose}
    >
      <p className="dialog-intro">
        {te
          ? "మీ అవసరాలు చెప్పండి. లభ్యత, ప్రస్తుత ధరలు, సరఫరా వివరాలు నేరుగా మాట్లాడుకుందాం."
          : "For restaurants, family celebrations and everything in between. Tell us what you need and we’ll take it from there."}
      </p>
      <div className="wholesale-form">
        <label htmlFor="business">
          {te ? "వ్యాపారం / వేడుక పేరు" : "Business or event name"}
        </label>
        <input
          id="business"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          placeholder={
            te
              ? "మీ హోటల్ లేదా వేడుక పేరు"
              : "Your restaurant, catering business or occasion"
          }
          maxLength={150}
        />
        <label htmlFor="varieties">
          {te ? "కావలసిన రకాలు" : "What are you looking for?"}
        </label>
        <input
          id="varieties"
          value={varieties}
          onChange={(e) => setVarieties(e.target.value)}
          placeholder={
            te ? "కట్ల, కొరమీను, రొయ్యలు…" : "Catla, Korameenu, prawns…"
          }
          maxLength={300}
        />
        <label htmlFor="quantity">
          {te ? "అంచనా పరిమాణం" : "Approximate quantity"}
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        >
          {["10–25 kg", "25–50 kg", "50–100 kg", "100+ kg"].map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>
      </div>
      <a
        className="button button-whatsapp button-full"
        href={whatsappUrl(buildWholesaleMessage(business, varieties, quantity))}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={18} />
        {te ? "ధరల కోసం సంప్రదించండి" : "Let’s talk on WhatsApp"}
        <ArrowRight size={18} />
      </a>
      <p className="form-note text-center">
        {te
          ? "ధరలు, లభ్యతను షాప్ నిర్ధారిస్తుంది."
          : "Rates and availability confirmed directly by the shop."}
      </p>
    </Dialog>
  );
}

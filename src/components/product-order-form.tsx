"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { BasketItem, Product } from "@/types";
import { currency, estimate } from "@/lib/store";

type Language = "en" | "te";

export function ProductOrderForm({
  product,
  language,
  onAdd,
}: {
  product: Product;
  language: Language;
  onAdd: (item: BasketItem) => void;
}) {
  const te = language === "te";
  const [preferredCut, setCut] = useState(product.cuts[0]);
  const cut = product.cuts.includes(preferredCut)
    ? preferredCut
    : product.cuts[0];
  const [weight, setWeight] = useState(1);
  const total = estimate(product.pricePerKg, weight);
  return (
    <div className="product-order-form">
      <div className="cut-product-summary">
        <div className="cut-thumbnail">
          <Image
            src={product.image || `/images/${product.id}.webp`}
            alt={te ? product.nameTe : product.nameEn}
            fill
            sizes="100px"
          />
        </div>
        <div>
          <p>{te ? product.nameEn : product.nameTe}</p>
          <strong>
            {product.pricePerKg === null
              ? te
                ? "ధర అడగండి"
                : "Price on request"
              : `${currency(product.pricePerKg)} / kg`}
          </strong>
        </div>
        <span className="availability-dot">{te ? "లభ్యం" : "Available"}</span>
      </div>
      <fieldset>
        <legend>
          <span>01</span>
          {te ? "కట్ ఎంచుకోండి" : "Choose your preparation"}
        </legend>
        <div className="cut-options">
          {product.cuts.map((option) => (
            <button
              key={option}
              className={`cut-option${cut === option ? " selected" : ""}`}
              aria-pressed={cut === option}
              onClick={() => setCut(option)}
            >
              <span>{option}</span>
              {cut === option && <Check size={17} />}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>
          <span>02</span>
          {te ? "పరిమాణం ఎంచుకోండి" : "How much would you like?"}
        </legend>
        <div className="weight-control">
          <button
            className="icon-button"
            aria-label={te ? "బరువు తగ్గించండి" : "Decrease weight"}
            disabled={weight <= 0.5}
            onClick={() => setWeight((w) => Math.max(0.5, w - 0.5))}
          >
            <Minus size={18} />
          </button>
          <output aria-live="polite">
            {weight.toFixed(1)} <span>kg</span>
          </output>
          <button
            className="icon-button"
            aria-label={te ? "బరువు పెంచండి" : "Increase weight"}
            disabled={weight >= 50}
            onClick={() => setWeight((w) => Math.min(50, w + 0.5))}
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="quick-weights">
          {[0.5, 1, 2, 3].map((w) => (
            <button
              key={w}
              onClick={() => setWeight(w)}
              className={weight === w ? "selected" : ""}
              aria-pressed={weight === w}
            >
              {w} kg
            </button>
          ))}
        </div>
      </fieldset>
      <div className="estimate-row">
        <span>{te ? "అంచనా మొత్తం" : "Estimated total"}</span>
        <strong>
          {total === null
            ? te
              ? "ధర అడగండి"
              : "Price on request"
            : currency(total)}
        </strong>
      </div>
      <p className="form-note">
        {te
          ? "శుభ్రం చేసిన తర్వాత బరువు మారవచ్చు. తుది ధరను WhatsAppలో నిర్ధారిస్తాం."
          : "Weight may change after cleaning. We’ll confirm the final weight and price on WhatsApp."}
      </p>
      <button
        className="button button-navy button-full"
        onClick={() =>
          onAdd({
            id: `${product.id}-${crypto.randomUUID()}`,
            productId: product.id,
            image: product.image,
            nameEn: product.nameEn,
            nameTe: product.nameTe,
            cut,
            weightKg: weight,
            pricePerKg: product.pricePerKg,
            approxTotal: total,
          })
        }
      >
        <ShoppingBag size={18} />
        {te ? "బుట్టలో చేర్చండి" : "Add to basket"}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

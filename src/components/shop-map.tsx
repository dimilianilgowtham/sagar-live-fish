import { ArrowUpRight, MapPin } from "lucide-react";
import { SHOP_DETAILS } from "@/data/shop";

export default function ShopMap({ language }: { language: "en" | "te" }) {
  const te = language === "te";
  return (
    <section className="container shop-map" aria-labelledby="shop-map-title">
      <div className="shop-map-copy">
        <p className="eyebrow"><MapPin size={16} />{te ? "మా షాప్‌కు రండి" : "COME BY THE SHOP"}</p>
        <h2 id="shop-map-title">{te ? "వడ్లపూడిలో కలుద్దాం." : "Find us in Vadlapudi."}</h2>
        <address>{SHOP_DETAILS.address?.[language]}</address>
        <a className="button button-navy" href={SHOP_DETAILS.location.directionsUrl} target="_blank" rel="noopener noreferrer">
          {te ? "Google Mapsలో దారి చూడండి" : "Get directions on Google Maps"}<ArrowUpRight size={18} />
        </a>
      </div>
      <a className="shop-map-card" href={SHOP_DETAILS.location.mapsUrl} target="_blank" rel="noopener noreferrer">
        <span className="shop-map-pin"><MapPin size={46} strokeWidth={1.4} aria-hidden="true" /></span>
        <span className="eyebrow">{te ? "సాగర్ లైవ్ ఫిష్" : "SAGAR LIVE FISH"}</span>
        <strong>{te ? "వడ్లపూడి" : "Vadlapudi"}</strong>
        <span className="shop-map-card-link">{te ? "Google Mapsలో షాప్ స్థానం చూడండి" : "Open our shop pin in Google Maps"}<ArrowUpRight size={18} /></span>
      </a>
    </section>
  );
}

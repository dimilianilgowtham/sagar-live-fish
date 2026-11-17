"use client";

import { PHONE } from "@/lib/store";

export default function StoreError({ retry }: { retry: () => void }) {
  return (
    <section className="storefront-loading" role="alert">
      <span>SAGAR LIVE FISH</span>
      <h1>Let’s try that again.</h1>
      <p>We couldn’t load the catch. Check your connection and try again, or call the shop.</p>
      <button className="button button-aqua" onClick={retry}>Try again</button>
      <a href={`tel:+91${PHONE}`}>Call +91 {PHONE}</a>
    </section>
  );
}

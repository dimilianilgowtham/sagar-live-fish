import Link from "next/link";
import { ArrowUpRight, Fish } from "lucide-react";
import { Brand } from "@/components/site-shell";
import "./storefront.css";

export default function NotFound() {
  return (
    <div className="static-error-shell">
      <header className="container">
        <Brand />
      </header>
      <main className="missing-catch container">
        <Fish size={54} strokeWidth={1} />
        <p className="eyebrow">404 / A LITTLE OFF COURSE</p>
        <h1>
          This catch has <em>sailed on.</em>
        </h1>
        <p>
          This fish may no longer be listed. There’s more to discover at the
          counter.
        </p>
        <p lang="te">
          ఈ చేప వివరాలు అందుబాటులో లేవు. మరిన్ని తాజా చేపలు చూడండి.
        </p>
        <Link className="button button-navy" href="/shop">
          Back to the fish counter
          <ArrowUpRight size={17} />
        </Link>
        <Link className="text-link" href="/">
          Sagar Live Fish home
        </Link>
      </main>
    </div>
  );
}

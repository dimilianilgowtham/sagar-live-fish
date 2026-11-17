"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { CatalogueSnapshot } from "@/types/admin";

export function useCatalogue(initial: CatalogueSnapshot) {
  const pathname = usePathname();
  const [catalogue, setCatalogue] = useState(initial);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    let pending: AbortController | null = null;
    async function refresh() {
      if (pending || document.visibilityState === "hidden") return;
      const abort = new AbortController();
      pending = abort;
      const timeout = window.setTimeout(() => abort.abort(), 10_000);
      try {
        const response = await fetch("/api/catalogue", {
          cache: "no-store",
          signal: abort.signal,
        });
        if (!response.ok) throw new Error("Catalogue unavailable");
        const next: CatalogueSnapshot = await response.json();
        if (!active) return;
        setCatalogue((current) =>
          current.revision === next.revision ? current : next,
        );
        setUnavailable(false);
      } catch {
        if (active) setUnavailable(true);
      } finally {
        window.clearTimeout(timeout);
        pending = null;
      }
    }
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    void refresh();
    return () => {
      active = false;
      pending?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [pathname]);
  return { ...catalogue, unavailable };
}

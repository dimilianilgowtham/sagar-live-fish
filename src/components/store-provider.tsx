"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BasketItem, Product } from "@/types";
import type { CatalogueSnapshot } from "@/types/admin";
import { readBasket } from "@/lib/store";
import { useCatalogue } from "@/lib/use-catalogue";
import { usePersistentState } from "@/lib/use-persistent-state";
import { BasketDialog, CutDialog, WholesaleDialog } from "./order-dialogs";

const decodeLanguage = (raw: string | null): "en" | "te" =>
  raw === '"te"' ? "te" : "en";
type StoreContext = {
  products: Product[];
  unavailable: boolean;
  updatedAt: string;
  revision: number;
  language: "en" | "te";
  setLanguage: (value: "en" | "te") => void;
  t: (en: string, te: string) => string;
  basket: BasketItem[];
  chooseProduct: (product: Product) => void;
  addToBasket: (item: BasketItem) => void;
  openBasket: () => void;
  openWholesale: () => void;
};
const Context = createContext<StoreContext | null>(null);

export function StoreProvider({
  initialCatalogue,
  children,
}: {
  initialCatalogue: CatalogueSnapshot;
  children: ReactNode;
}) {
  const router = useRouter();
  const { products, unavailable, updatedAt, revision } =
    useCatalogue(initialCatalogue);
  const decodeBasket = useCallback(
    (raw: string | null) => readBasket(raw, products),
    [products],
  );
  const [basket, setBasket, storedBasket] = usePersistentState(
    "sagar_next_basket",
    decodeBasket,
  );
  const [language, setLanguage] = usePersistentState(
    "sagar_language",
    decodeLanguage,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modal, setModal] = useState<"basket" | "wholesale" | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    basketAction?: boolean;
  } | null>(null);
  const t = useCallback(
    (en: string, te: string) => (language === "te" ? te : en),
    [language],
  );
  const activeProduct = products.find(
    (product) => product.id === activeId && product.isAvailable,
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    if (storedBasket === null || storedBasket === JSON.stringify(basket))
      return;
    // Batch external-storage reconciliation and its notice after this render.
    // Cancel it if a newer catalogue/basket arrives before it runs.
    const correction = window.setTimeout(() => {
      setBasket(basket);
      setToast({
        message: t(
          "Your basket was updated with the latest prices, stock and preparation options.",
          "తాజా ధరలు, లభ్యత, కట్స్ ప్రకారం మీ బుట్టను నవీకరించాం.",
        ),
      });
    }, 0);
    return () => window.clearTimeout(correction);
  }, [basket, setBasket, storedBasket, t]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const addToBasket = (item: BasketItem) => {
    const current = products.find((product) => product.id === item.productId);
    if (
      !current?.isAvailable ||
      current.pricePerKg !== item.pricePerKg ||
      !current.cuts.includes(item.cut)
    ) {
      setActiveId(null);
      setToast({
        message: t(
          "This catch has changed. Please check the latest price and preparation.",
          "ఈ చేప వివరాలు మారాయి. తాజా ధర, కట్ వివరాలు చూడండి.",
        ),
      });
      return;
    }
    setBasket((items) => [...items, item]);
    setActiveId(null);
    setToast({
      message: t("A good choice. Added to your basket.", "మీ బుట్టలో చేర్చాం."),
      basketAction: true,
    });
  };

  return (
    <Context.Provider
      value={{
        products,
        unavailable,
        updatedAt,
        revision,
        language,
        setLanguage,
        t,
        basket,
        chooseProduct: (product) => setActiveId(product.id),
        addToBasket,
        openBasket: () => setModal("basket"),
        openWholesale: () => setModal("wholesale"),
      }}
    >
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="toast">
            <Check size={18} />
            <span>{toast.message}</span>
            {toast.basketAction && (
              <button
                className="text-button"
                onClick={() => {
                  setToast(null);
                  setModal("basket");
                }}
              >
                {t("View basket", "బుట్ట చూడండి")}
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      {activeProduct && (
        <CutDialog
          key={activeProduct.id}
          product={activeProduct}
          language={language}
          onClose={() => setActiveId(null)}
          onAdd={addToBasket}
        />
      )}
      {modal === "basket" && (
        <BasketDialog
          basket={basket}
          language={language}
          onClose={() => setModal(null)}
          onRemove={(id) =>
            setBasket((items) => items.filter((item) => item.id !== id))
          }
          onClear={() => setBasket([])}
          onBrowse={() => {
            setModal(null);
            router.push("/shop");
          }}
        />
      )}
      {modal === "wholesale" && (
        <WholesaleDialog language={language} onClose={() => setModal(null)} />
      )}
    </Context.Provider>
  );
}

export function useStore() {
  const value = useContext(Context);
  if (!value)
    throw new Error("Store components need the shared storefront layout.");
  return value;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Clipboard,
  ExternalLink,
  Fish,
  History,
  LayoutDashboard,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  PackageCheck,
  QrCode,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shell,
  ShoppingBasket,
  Waves,
  X,
} from "lucide-react";
import { Dialog } from "@/components/dialog";
import { AdminApiError, adminRequest } from "@/lib/admin-client";
import { currency, PHONE } from "@/lib/store";
import type {
  AdminCatalogue,
  ManagedProduct,
  OwnerIdentity,
} from "@/types/admin";
import ProductEditor, { type ProductInput } from "./product-editor";
import CatalogueHistory from "./catalogue-history";
import BrandLogo from "../brand-logo";
import PasswordDialog from "./password-dialog";

type View = "overview" | "catalogue" | "rates" | "history";
type Status =
  | "active"
  | "available"
  | "soldout"
  | "unpriced"
  | "archived"
  | "all";
type PriceDraft = { value: string; revision: number };
const categories = [
  {
    id: "freshwater",
    name: "Freshwater fish",
    telugu: "మంచినీటి చేపలు",
    icon: Leaf,
  },
  { id: "marine", name: "Marine fish", telugu: "సముద్రపు చేపలు", icon: Waves },
  {
    id: "shellfish",
    name: "Prawns & crabs",
    telugu: "రొయ్యలు & పీతలు",
    icon: Shell,
  },
] as const;

function photo(product: ManagedProduct) {
  return product.image ?? `/images/${product.id}.webp`;
}

function buildRateCard(catalogue: AdminCatalogue) {
  const products = catalogue.products.filter(
    (product) => !product.archived && product.isAvailable,
  );
  return [
    "*SAGAR LIVE FISH — FRESH CATCH & RATES*",
    `Updated: ${catalogue.updatedAt.slice(0, 10)}`,
    "",
    ...products.map(
      (product) =>
        `• ${product.nameEn}${product.nameTe && product.nameTe !== product.nameEn ? ` (${product.nameTe})` : ""}\n  ${product.pricePerKg === null ? "Price on request" : `${currency(product.pricePerKg)} / kg`}`,
    ),
    ...(products.length ? [] : ["Please contact us for the next fresh catch."]),
    "",
    "Availability and final prices are confirmed when you order.",
    `Call / WhatsApp: ${PHONE}`,
  ].join("\n");
}

export default function AdminDashboard({
  owner,
  initialCatalogue,
  publicSiteUrl = null,
}: {
  owner: OwnerIdentity;
  initialCatalogue: AdminCatalogue;
  publicSiteUrl?: string | null;
}) {
  const [catalogue, setCatalogue] = useState(initialCatalogue);
  useEffect(() => { document.documentElement.lang = "en"; }, []);
  const current = useRef(initialCatalogue);
  const [view, setView] = useState<View>("overview");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<Status>("active");
  const [drafts, setDrafts] = useState<Record<string, PriceDraft>>({});
  const [editor, setEditor] = useState<{
    product: ManagedProduct | null;
    revision: number;
  } | null>(null);
  const [bulk, setBulk] = useState<boolean | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const mutationPending = useRef(false);
  const [notice, setNotice] = useState<{
    text: string;
    error: boolean;
    reauth?: boolean;
  } | null>(null);
  const [copiedText, setCopiedText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const acceptCatalogue = useCallback((snapshot: AdminCatalogue) => {
    if (snapshot.revision >= current.current.revision) {
      current.current = snapshot;
      setCatalogue(snapshot);
    }
  }, []);

  const refreshCatalogue = useCallback(async () => {
    const fresh = await adminRequest<AdminCatalogue>("/api/admin/products");
    acceptCatalogue(fresh);
    return fresh;
  }, [acceptCatalogue]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !mutationPending.current) {
        void refreshCatalogue().catch((failure) => {
          if (failure instanceof AdminApiError && failure.status === 401) {
            setNotice({ text: failure.message, error: true, reauth: true });
          }
        });
      }
    };
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refreshCatalogue]);

  async function mutate(
    path: string,
    method: string,
    body: unknown,
    message: string,
    revision = current.current.revision,
  ) {
    if (mutationPending.current)
      throw new Error("Please wait for the current change to finish.");
    mutationPending.current = true;
    setPending(path);
    setNotice(null);
    try {
      const updated = await adminRequest<AdminCatalogue>(path, {
        method,
        headers: { "If-Match": String(revision) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      acceptCatalogue(updated);
      setNotice({ text: message, error: false });
    } catch (failure) {
      let message =
        failure instanceof Error
          ? failure.message
          : "Your change could not be saved. Please try again.";
      if (failure instanceof AdminApiError && failure.status === 409) {
        message =
          "The catalogue changed in another window. The latest version is loaded; your edits are kept. Review them and save again.";
        try {
          const latest = await refreshCatalogue();
          setEditor((value) =>
            value ? { ...value, revision: latest.revision } : null,
          );
          setDrafts((values) =>
            Object.fromEntries(
              Object.entries(values).map(([id, draft]) => [
                id,
                { ...draft, revision: latest.revision },
              ]),
            ),
          );
        } catch {
          message =
            "The catalogue changed in another window, and the latest version could not be loaded. Your edits are kept. Refresh the catalogue before trying again.";
        }
      }
      const statusCode = failure instanceof AdminApiError ? failure.status : 0;
      setNotice({ text: message, error: true, reauth: statusCode === 401 });
      throw new AdminApiError(message, statusCode);
    } finally {
      mutationPending.current = false;
      setPending(null);
    }
  }

  async function saveProduct(data: ProductInput) {
    if (!editor) return;
    await mutate(
      editor.product
        ? `/api/admin/products/${editor.product.id}`
        : "/api/admin/products",
      editor.product ? "PATCH" : "POST",
      data,
      editor.product
        ? "Product updated. Your shop has the latest details."
        : "Product added to your catalogue.",
      editor.revision,
    );
    if (editor.product) {
      const id = editor.product.id;
      setDrafts((values) => {
        const next = { ...values };
        delete next[id];
        return next;
      });
    }
    setEditor(null);
  }

  async function savePrice(
    event: FormEvent<HTMLFormElement>,
    product: ManagedProduct,
  ) {
    event.preventDefault();
    const draft = drafts[product.id];
    if (!draft) return;
    const value = draft.value.trim();
    if (
      value &&
      (!Number.isFinite(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > 1_000_000)
    ) {
      setNotice({
        text: "Enter a price from ₹0 to ₹10,00,000, or leave it empty for price on request.",
        error: true,
      });
      return;
    }
    try {
      await mutate(
        `/api/admin/products/${product.id}`,
        "PATCH",
        { pricePerKg: value ? Number(value) : null },
        `Price updated for ${product.nameEn}.`,
        draft.revision,
      );
      setDrafts((values) => {
        const next = { ...values };
        delete next[product.id];
        return next;
      });
    } catch {
      /* The draft stays in place and the error is shown above the table. */
    }
  }

  async function refreshManually() {
    setRefreshing(true);
    try {
      const fresh = await refreshCatalogue();
      setDrafts((values) =>
        Object.fromEntries(
          Object.entries(values).map(([id, draft]) => [
            id,
            { ...draft, revision: fresh.revision },
          ]),
        ),
      );
      setNotice({
        text: "Catalogue refreshed. Any unfinished edits have been kept.",
        error: false,
      });
    } catch (failure) {
      setNotice({
        text:
          failure instanceof Error
            ? failure.message
            : "Could not refresh the catalogue.",
        error: true,
        reauth: failure instanceof AdminApiError && failure.status === 401,
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function logout() {
    if (mutationPending.current) return;
    setPending("logout");
    try {
      await adminRequest("/api/admin/logout", { method: "POST" });
      // A fresh server request discards the authenticated workspace payload.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin");
    } catch (failure) {
      setPending(null);
      setNotice({
        text:
          failure instanceof Error
            ? failure.message
            : "Could not sign out. Please try again.",
        error: true,
        reauth: failure instanceof AdminApiError && failure.status === 401,
      });
    }
  }

  function openCatalogue(nextStatus: Status = "active") {
    setStatus(nextStatus);
    setCategory("all");
    setSearch("");
    setView("catalogue");
  }

  const active = catalogue.products.filter((product) => !product.archived);
  const available = active.filter((product) => product.isAvailable);
  const soldOut = active.filter((product) => !product.isAvailable);
  const unpriced = active.filter((product) => product.pricePerKg === null);
  const archived = catalogue.products.filter((product) => product.archived);
  const filtered = catalogue.products.filter((product) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch =
      !query ||
      `${product.nameEn} ${product.nameTe} ${product.descEn}`
        .toLocaleLowerCase()
        .includes(query);
    const matchesCategory = category === "all" || product.category === category;
    const matchesStatus =
      status === "all" ||
      (status === "archived"
        ? product.archived
        : !product.archived &&
          (status === "active" ||
            (status === "available" && product.isAvailable) ||
            (status === "soldout" && !product.isAvailable) ||
            (status === "unpriced" && product.pricePerKg === null)));
    return matchesSearch && matchesCategory && matchesStatus;
  });
  const rateCard = buildRateCard(catalogue);
  const copied = copiedText === rateCard;
  const viewName =
    view === "overview"
      ? "Overview"
      : view === "catalogue"
        ? "Catalogue"
        : view === "rates" ? "Rate card" : "History";
  const firstName = owner.name.trim().split(/\s+/)[0] || "owner";

  return (
    <div className="admin-workspace">
      <a href="#admin-content" className="skip-link">
        Skip to workspace
      </a>
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand" aria-label="Sagar Live Fish home">
          <BrandLogo preload />
          <small>OWNER WORKSPACE</small>
        </Link>
        <div className="admin-sidebar-label">YOUR SHOP</div>
        <nav className="admin-nav" aria-label="Owner workspace">
          {(
            [
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "catalogue", label: "Catalogue", icon: ShoppingBasket },
              { id: "rates", label: "Rate card", icon: Clipboard },
              { id: "history", label: "History", icon: History },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={view === item.id ? "is-active" : ""}
              aria-current={view === item.id ? "page" : undefined}
            >
              <item.icon size={18} strokeWidth={1.6} />
              <span>{item.label}</span>
              {view === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-note">
          <span className="admin-live-dot" />
          <p>
            A little care here.
            <br />
            <strong>A fresher shop for everyone.</strong>
          </p>
        </div>
        <div className="admin-sidebar-bottom">
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} />
            View storefront
            <ArrowRight size={14} />
          </Link>
          <div className="admin-owner">
            <span className="admin-owner-avatar">
              {firstName.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{owner.name}</strong>
              <small>Shop owner</small>
            </div>
            <button
              aria-label="Sign out"
              title="Sign out"
              onClick={logout}
              disabled={!!pending}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{viewName}</strong>
          </div>
          <div className="admin-topbar-right">
            <button className="admin-refresh" aria-label="Change password" title="Change password" onClick={() => setPasswordOpen(true)}>
              <LockKeyhole size={17} />
            </button>
            <span className="admin-shop-status">
              <span className="admin-live-dot" /> Shared shop catalogue
            </span>
            {view !== "history" && <button
              className="admin-refresh"
              onClick={refreshManually}
              disabled={refreshing || !!pending}
              aria-label="Refresh catalogue"
              title="Refresh catalogue"
            >
              <RefreshCw size={16} className={refreshing ? "admin-spin" : ""} />
            </button>}
          </div>
        </header>
        <main id="admin-content" className="admin-content">
          <div className="admin-page-heading">
            <div>
              <p className="admin-kicker">
                {view === "overview"
                  ? "EVERY FRESH DAY STARTS HERE"
                  : view === "catalogue"
                    ? "THE CATCH, ALL IN ONE PLACE"
                    : view === "rates" ? "FRESH RATES, READY TO SHARE" : "A RECORD OF YOUR CARE"}
              </p>
              <h1>
                {view === "overview" ? (
                  <>
                    Your shop, <em>at a glance.</em>
                  </>
                ) : view === "catalogue" ? (
                  <>
                    Care for your <em>catalogue.</em>
                  </>
                ) : view === "rates" ? (
                  <>
                    A good catch. <em>Spread the word.</em>
                  </>
                ) : (
                  <>Your catalogue, <em>over time.</em></>
                )}
              </h1>
              <p>
                {view === "overview"
                  ? `Good to see you, ${firstName}. Here’s how your catalogue looks.`
                  : view === "catalogue"
                    ? "Keep every variety, price and availability up to date."
                    : view === "rates" ? "A simple rate card, made from what’s available in your shop." : "See what changed, who saved it and the values before and after."}
              </p>
            </div>
            {(view === "overview" || view === "catalogue") && (
              <button
                className="admin-button admin-button-primary"
                onClick={() =>
                  setEditor({
                    product: null,
                    revision: current.current.revision,
                  })
                }
                disabled={!!pending}
              >
                <Plus size={17} />
                Add product
              </button>
            )}
          </div>
          {notice && (
            <div
              className={`admin-notice${notice.error ? " admin-notice-error" : " admin-notice-success"}`}
              role={notice.error ? "alert" : "status"}
            >
              {notice.error ? <CircleHelp size={18} /> : <Check size={18} />}
              <div className="admin-notice-copy">
                <p>{notice.text}</p>
                {notice.reauth && (
                  <Link
                    href="/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-reauth-link"
                  >
                    Sign in again
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {view === "overview" && (
            <>
              <section className="admin-metrics" aria-label="Catalogue summary">
                {[
                  {
                    label: "In your catalogue",
                    value: active.length,
                    detail: `${archived.length} archived`,
                    icon: Fish,
                    filter: "active" as Status,
                  },
                  {
                    label: "Available to order",
                    value: available.length,
                    detail: "Ready for your customers",
                    icon: PackageCheck,
                    filter: "available" as Status,
                  },
                  {
                    label: "Currently sold out",
                    value: soldOut.length,
                    detail: "Bring them back when ready",
                    icon: ShoppingBasket,
                    filter: "soldout" as Status,
                  },
                  {
                    label: "Price on request",
                    value: unpriced.length,
                    detail: "Customers will ask for a rate",
                    icon: CircleHelp,
                    filter: "unpriced" as Status,
                  },
                ].map((metric) => (
                  <button
                    className="admin-metric"
                    key={metric.label}
                    onClick={() => openCatalogue(metric.filter)}
                  >
                    <span className="admin-metric-label">
                      {metric.label}
                      <metric.icon size={18} strokeWidth={1.4} />
                    </span>
                    <strong>{String(metric.value).padStart(2, "0")}</strong>
                    <span className="admin-metric-detail">
                      {metric.detail}
                      <ArrowRight size={14} />
                    </span>
                  </button>
                ))}
              </section>
              <section className="admin-welcome-panel">
                <div>
                  <p className="admin-kicker">READY WHEN YOUR CUSTOMERS ARE</p>
                  <h2>
                    Fresh catch.
                    <br />
                    <em>Clear prices.</em>
                  </h2>
                  <p>
                    A quick check of your catalogue keeps the shop looking its
                    best. The details you save here appear in your storefront.
                  </p>
                  <button
                    className="admin-button admin-button-aqua"
                    onClick={() => openCatalogue()}
                  >
                    Review the catalogue
                    <ArrowRight size={16} />
                  </button>
                </div>
                <div className="admin-welcome-photo">
                  <Image
                    src={
                      available[0] ? photo(available[0]) : "/images/hero.webp"
                    }
                    alt={
                      available[0]?.nameEn ?? "Fresh catch at Sagar Live Fish"
                    }
                    fill
                    unoptimized
                    loading="eager"
                    sizes="(max-width: 700px) 90vw, 35vw"
                  />
                  <span>
                    <span className="admin-live-dot" />
                    {available[0]?.nameEn ?? "Freshness, every day"}
                  </span>
                </div>
              </section>
              <div className="admin-overview-grid">
                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <p className="admin-kicker">A LITTLE OF EVERYTHING</p>
                      <h2>Your varieties</h2>
                    </div>
                    <span className="admin-small-count">
                      {active.length} products
                    </span>
                  </div>
                  <div className="admin-category-list">
                    {categories.map((item) => {
                      const products = active.filter(
                        (product) => product.category === item.id,
                      );
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            openCatalogue();
                            setCategory(item.id);
                          }}
                        >
                          <span className="admin-category-icon">
                            <item.icon size={21} strokeWidth={1.3} />
                          </span>
                          <span>
                            <strong>{item.name}</strong>
                            <small lang="te">{item.telugu}</small>
                          </span>
                          <span className="admin-category-count">
                            {products.length}
                            <small>
                              {
                                products.filter(
                                  (product) => product.isAvailable,
                                ).length
                              }{" "}
                              available
                            </small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section className="admin-panel admin-quick-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <p className="admin-kicker">THE EVERYDAY ESSENTIALS</p>
                      <h2>A few quick updates</h2>
                    </div>
                  </div>
                  <p>
                    Fresh stock has arrived, or you’re wrapping up? Update
                    availability across your active catalogue in one go.
                  </p>
                  <div className="admin-bulk-actions">
                    <button
                      className="admin-button admin-button-secondary"
                      disabled={!!pending || !soldOut.length}
                      onClick={() => setBulk(true)}
                    >
                      <CheckCheck size={17} />
                      Set all available
                      <ArrowRight size={15} />
                    </button>
                    <button
                      className="admin-button admin-button-secondary"
                      disabled={!!pending || !available.length}
                      onClick={() => setBulk(false)}
                    >
                      <Archive size={16} />
                      Mark all sold out
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="admin-quick-tip">
                    <Clipboard size={18} />
                    <p>
                      Rates ready to go?
                      <button onClick={() => setView("rates")}>
                        Make a rate card
                        <ArrowRight size={13} />
                      </button>
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
          {view === "catalogue" && (
            <section
              className="admin-catalogue-panel"
              aria-label="Product catalogue"
            >
              <div className="admin-catalogue-toolbar">
                <label className="admin-search">
                  <Search size={18} />
                  <span className="sr-only">Search products</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Find a fish, prawn or crab…"
                  />
                </label>
                <div className="admin-filters">
                  <label>
                    <span className="sr-only">Filter by category</span>
                    <select
                      aria-label="Filter by category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      <option value="all">All categories</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filter by status</span>
                    <select
                      aria-label="Filter by status"
                      value={status}
                      onChange={(event) =>
                        setStatus(event.target.value as Status)
                      }
                    >
                      <option value="active">Active products</option>
                      <option value="available">Available</option>
                      <option value="soldout">Sold out</option>
                      <option value="unpriced">Price on request</option>
                      <option value="archived">Archived</option>
                      <option value="all">All products</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="admin-table-caption">
                <p>
                  <strong>{filtered.length}</strong>{" "}
                  {filtered.length === 1 ? "product" : "products"}
                  {search.trim()
                    ? ` matching “${search.trim()}”`
                    : " in this view"}
                </p>
                <span>
                  <span className="admin-live-dot" /> Changes go live when saved
                </span>
              </div>
              {filtered.length ? (
                <div className="admin-table-scroll">
                  <table className="admin-product-table">
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col">Category</th>
                        <th scope="col">Price / kg</th>
                        <th scope="col">Availability</th>
                        <th scope="col">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((product) => {
                        const draft = drafts[product.id];
                        const priceValue =
                          draft?.value ??
                          (product.pricePerKg === null
                            ? ""
                            : String(product.pricePerKg));
                        const dirty =
                          !!draft &&
                          draft.value !==
                            (product.pricePerKg === null
                              ? ""
                              : String(product.pricePerKg));
                        return (
                          <tr
                            key={product.id}
                            className={product.archived ? "is-archived" : ""}
                          >
                            <td>
                              <div className="admin-table-product">
                                <div className="admin-product-thumbnail">
                                  <Image
                                    src={photo(product)}
                                    alt=""
                                    fill
                                    unoptimized
                                    sizes="64px"
                                  />
                                </div>
                                <div>
                                  <strong>{product.nameEn}</strong>
                                  <small lang="te">{product.nameTe}</small>
                                  {product.badge && (
                                    <span className="admin-product-badge">
                                      {product.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="admin-category-tag">
                                {
                                  categories.find(
                                    (item) => item.id === product.category,
                                  )?.name
                                }
                              </span>
                            </td>
                            <td>
                              <form
                                className="admin-inline-price"
                                onSubmit={(event) => savePrice(event, product)}
                              >
                                <label className="admin-price-input">
                                  <span>₹</span>
                                  <input
                                    aria-label={`Price per kg for ${product.nameEn}`}
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    step="0.01"
                                    value={priceValue}
                                    placeholder="Ask"
                                    onChange={(event) =>
                                      setDrafts((values) => ({
                                        ...values,
                                        [product.id]: {
                                          value: event.target.value,
                                          revision:
                                            values[product.id]?.revision ??
                                            current.current.revision,
                                        },
                                      }))
                                    }
                                    disabled={!!pending || product.archived}
                                  />
                                </label>
                                {dirty && (
                                  <button
                                    type="submit"
                                    className="admin-inline-save"
                                    disabled={!!pending}
                                    aria-label={`Save price for ${product.nameEn}`}
                                  >
                                    {pending ===
                                    `/api/admin/products/${product.id}` ? (
                                      <LoaderCircle
                                        size={14}
                                        className="admin-spin"
                                      />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                  </button>
                                )}
                                {product.pricePerKg === null && !dirty && (
                                  <small>On request</small>
                                )}
                              </form>
                            </td>
                            <td>
                              {product.archived ? (
                                <span className="admin-archived-label">
                                  <Archive size={13} />
                                  Archived
                                </span>
                              ) : (
                                <div className="admin-stock-control">
                                  <button
                                    className={`admin-switch${product.isAvailable ? " is-on" : ""}`}
                                    type="button"
                                    role="switch"
                                    aria-checked={product.isAvailable}
                                    aria-label={`${product.nameEn} available`}
                                    disabled={!!pending}
                                    onClick={() => {
                                      void mutate(
                                        `/api/admin/products/${product.id}`,
                                        "PATCH",
                                        { isAvailable: !product.isAvailable },
                                        `${product.nameEn} marked ${product.isAvailable ? "sold out" : "available"}.`,
                                      ).catch(() => {});
                                    }}
                                  >
                                    <span>
                                      {product.isAvailable && (
                                        <Check size={11} />
                                      )}
                                    </span>
                                  </button>
                                  <span>
                                    {product.isAvailable
                                      ? "Available"
                                      : "Sold out"}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button
                                  className="admin-row-edit"
                                  onClick={() =>
                                    setEditor({
                                      product,
                                      revision: current.current.revision,
                                    })
                                  }
                                  disabled={!!pending || product.archived}
                                  aria-label={`Edit ${product.nameEn}`}
                                >
                                  <Pencil size={14} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  className={
                                    product.archived
                                      ? "admin-row-restore"
                                      : "admin-row-archive"
                                  }
                                  disabled={!!pending}
                                  aria-label={`${product.archived ? "Restore" : "Archive"} ${product.nameEn}`}
                                  onClick={() => {
                                    void mutate(
                                      `/api/admin/products/${product.id}`,
                                      "PATCH",
                                      { archived: !product.archived },
                                      product.archived
                                        ? `${product.nameEn} restored to the shop.`
                                        : `${product.nameEn} archived. You can restore it from the Archived filter.`,
                                    ).catch(() => {});
                                  }}
                                >
                                  {product.archived ? (
                                    <>
                                      <RefreshCw size={14} />
                                      <span>Restore</span>
                                    </>
                                  ) : (
                                    <>
                                      <Archive size={14} />
                                      <span>Archive</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">
                  <Fish size={37} strokeWidth={1.1} />
                  <h2>
                    {search || category !== "all"
                      ? "No catch found."
                      : status === "archived"
                        ? "Nothing tucked away."
                        : "Room for a fresh catch."}
                  </h2>
                  <p>
                    {search || category !== "all"
                      ? "Try another search or clear the filters to see more varieties."
                      : status === "archived"
                        ? "Archived products will appear here, ready to restore when you need them."
                        : "Add a product, or choose another filter to see the rest of your catalogue."}
                  </p>
                  <button
                    className="admin-button admin-button-secondary"
                    onClick={() => {
                      setSearch("");
                      setCategory("all");
                      setStatus("all");
                    }}
                  >
                    Show all products
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
              <div className="admin-catalogue-footer">
                <p>
                  <CircleHelp size={14} />
                  Empty price means “price on request”. Archived products are
                  hidden from the storefront.
                </p>
                <span>Saved catalogue · v{catalogue.revision}</span>
              </div>
            </section>
          )}
          {view === "history" && <CatalogueHistory />}
          {view === "rates" && (
            <div className="admin-rate-layout">
              <section className="admin-rate-preview">
                <div className="admin-rate-preview-top">
                  <span>
                    <Fish size={20} strokeWidth={1.3} /> SAGAR LIVE FISH
                  </span>
                  <span>FRESH CATCH & RATES</span>
                </div>
                <div className="admin-rate-paper">
                  <p className="admin-kicker">FROM OUR COUNTER</p>
                  <h2>
                    Something fresh
                    <br />
                    <em>for your table.</em>
                  </h2>
                  <p className="admin-rate-date">
                    Catalogue updated {catalogue.updatedAt.slice(0, 10)}
                  </p>
                  <div className="admin-rate-list">
                    {available.length ? (
                      available.map((product) => (
                        <div key={product.id}>
                          <span>
                            <strong>{product.nameEn}</strong>
                            <small lang="te">{product.nameTe}</small>
                          </span>
                          <span>
                            {product.pricePerKg === null ? (
                              <small>Price on request</small>
                            ) : (
                              <>
                                <strong>{currency(product.pricePerKg)}</strong>
                                <small>/ kg</small>
                              </>
                            )}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="admin-rate-empty">
                        Our next fresh catch is on its way.
                        <br />
                        Contact us for availability.
                      </p>
                    )}
                  </div>
                  <div className="admin-rate-paper-foot">
                    <p>Freshness is our everyday promise.</p>
                    <span>Call / WhatsApp · {PHONE}</span>
                  </div>
                </div>
              </section>
              <aside className="admin-rate-controls">
                <span className="admin-category-icon">
                  <Clipboard size={23} strokeWidth={1.4} />
                </span>
                <h2>
                  Good food
                  <br />
                  travels by word.
                </h2>
                <p>
                  Copy these rates to share with your customers on WhatsApp or
                  anywhere else.
                </p>
                <div className="admin-rate-info">
                  <Check size={16} />
                  <span>
                    <strong>
                      {available.length} available{" "}
                      {available.length === 1 ? "product" : "products"}
                    </strong>
                    Only active, available products are included.
                  </span>
                </div>
                <button
                  className="admin-button admin-button-primary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(rateCard);
                      setCopiedText(rateCard);
                      setNotice({
                        text: "Rate card copied. It’s ready to paste and share.",
                        error: false,
                      });
                    } catch {
                      setNotice({
                        text: "Copy is unavailable in this browser. Select the rate card text below and copy it manually.",
                        error: true,
                      });
                    }
                  }}
                >
                  {copied ? <Check size={17} /> : <Clipboard size={17} />}
                  {copied ? "Copied to clipboard" : "Copy rate card"}
                </button>
                <details className="admin-rate-text">
                  <summary>
                    View & select the text
                    <ArrowDownToLine size={14} />
                  </summary>
                  <label>
                    <span className="sr-only">Rate card text</span>
                    <textarea
                      readOnly
                      value={rateCard}
                      rows={14}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </label>
                </details>
                <p className="admin-rate-disclaimer">
                  Rates reflect the saved catalogue. Confirm availability and
                  final pricing with each customer.
                </p>
                <section className="admin-qr-panel" aria-labelledby="admin-qr-title">
                  <QrCode size={27} />
                  <h3 id="admin-qr-title">Your shop’s website QR</h3>
                  <p>Customers scan this at the counter to open your website on their phones.</p>
                  {publicSiteUrl ? <>
                    <a className="admin-button admin-button-primary" href="/api/admin/qr?format=png" download>Download QR image</a>
                    <a className="admin-button admin-button-secondary" href="/api/admin/qr?format=poster" target="_blank" rel="noopener noreferrer">Open print poster <ExternalLink size={15} /></a>
                    <p className="admin-qr-url">{publicSiteUrl}</p>
                  </> : <p>The QR download will appear after your permanent website address is configured.</p>}
                </section>
              </aside>
            </div>
          )}
          <footer className="admin-workspace-footer">
            <span>
              Sagar Live Fish <span>·</span> A little care, every day.
            </span>
            <Link href="/" target="_blank" rel="noopener noreferrer">
              See your shop
              <ExternalLink size={12} />
            </Link>
          </footer>
        </main>
      </div>
      {passwordOpen && <PasswordDialog onClose={() => setPasswordOpen(false)} onSaved={() => {
        setPasswordOpen(false);
        setNotice({ text: "Password changed. Other devices are signed out.", error: false });
      }} />}
      {editor && (
        <ProductEditor
          product={editor.product}
          onSave={saveProduct}
          onClose={() => setEditor(null)}
        />
      )}
      {bulk !== null && (
        <div
          onKeyDownCapture={(event) => {
            if (pending && event.key === "Escape") event.preventDefault();
          }}
        >
          <Dialog
            title={bulk ? "Ready for a fresh start?" : "All wrapped up?"}
            eyebrow="UPDATE YOUR WHOLE CATALOGUE"
            onClose={() => {
              if (!pending) setBulk(null);
            }}
          >
            <div className="admin-bulk-dialog">
              <p>
                {bulk
                  ? `This will mark all ${active.length} active products as available for customers to order.`
                  : `This will mark all ${active.length} active products as sold out. Customers will still see them in the shop.`}
              </p>
              <p>
                You can change individual products again at any time. Archived
                products stay archived.
              </p>
              <div className="admin-dialog-actions">
                <button
                  className="admin-button admin-button-secondary"
                  disabled={!!pending}
                  onClick={() => setBulk(null)}
                >
                  Cancel
                </button>
                <button
                  className="admin-button admin-button-primary"
                  disabled={!!pending}
                  onClick={async () => {
                    try {
                      await mutate(
                        "/api/admin/products/bulk",
                        "POST",
                        { available: bulk },
                        bulk
                          ? "All active products are now available."
                          : "All active products are now marked sold out.",
                      );
                      setBulk(null);
                    } catch {
                      /* Keep the confirmation open so it can be retried. */
                    }
                  }}
                >
                  {pending
                    ? "Saving…"
                    : bulk
                      ? "Set all available"
                      : "Mark all sold out"}
                </button>
              </div>
              {notice?.error && (
                <div className="admin-notice admin-notice-error" role="alert">
                  <div>
                    {notice.text}
                    {notice.reauth && (
                      <Link
                        href="/admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-reauth-link"
                      >
                        Sign in again
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Dialog>
        </div>
      )}
    </div>
  );
}

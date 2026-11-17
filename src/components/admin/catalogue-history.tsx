"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Clock3, History, LoaderCircle, RefreshCw } from "lucide-react";
import { AdminApiError, adminRequest } from "@/lib/admin-client";
import { currency } from "@/lib/store";
import type { CatalogueFieldChange, CatalogueHistoryAction, CatalogueHistoryEntry, CatalogueHistoryPage, CatalogueHistoryValue } from "@/types/admin";

const actions: Record<CatalogueHistoryAction, string> = {
  create: "Product added",
  update: "Product updated",
  archive: "Product archived",
  restore: "Product restored",
  availability: "Availability changed",
};
const fields: Record<CatalogueFieldChange["field"], string> = {
  nameEn: "English name", nameTe: "Telugu name", category: "Category",
  icon: "Product icon", descEn: "English description", descTe: "Telugu description",
  pricePerKg: "Price per kg", isAvailable: "Availability", badge: "Badge",
  cuts: "Preparation options", image: "Product photo", archived: "Shop listing",
};
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
});

function HistoryValue({ field, value, isNewProduct = false }: {
  field: CatalogueFieldChange["field"];
  value: CatalogueHistoryValue;
  isNewProduct?: boolean;
}) {
  if (isNewProduct) return <span className="admin-history-unset">Not set</span>;
  if (field === "pricePerKg") return <>{value === null ? "Price on request" : `${currency(Number(value))} / kg`}</>;
  if (field === "isAvailable") return <>{value ? "Available" : "Sold out"}</>;
  if (field === "archived") return <>{value ? "Archived · hidden from shop" : "Active · shown in shop"}</>;
  if (field === "category") return <>{value === "freshwater" ? "Freshwater fish" : value === "marine" ? "Marine fish" : "Prawns & crabs"}</>;
  if (field === "image" && typeof value === "string") {
    return <a className="admin-history-photo" href={value} target="_blank" rel="noopener noreferrer">
      <Image src={value} alt="Product photo" width={48} height={48} unoptimized />
      <span>View photo <ArrowRight size={12} aria-hidden="true" /></span>
    </a>;
  }
  if (Array.isArray(value)) return <>{value.join(", ")}</>;
  return <>{value === null || value === "" ? <span className="admin-history-unset">None</span> : String(value)}</>;
}

export default function CatalogueHistory() {
  const [entries, setEntries] = useState<CatalogueHistoryEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<{ message: string; reauth: boolean } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const moreRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void adminRequest<CatalogueHistoryPage>("/api/admin/history", { signal: controller.signal })
      .then((page) => {
        if (controller.signal.aborted) return;
        setEntries(page.entries);
        setNextCursor(page.nextCursor);
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        setError({
          message: failure instanceof Error ? failure.message : "Could not load catalogue history.",
          reauth: failure instanceof AdminApiError && failure.status === 401,
        });
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); moreRequest.current?.abort(); };
  }, [refreshKey]);

  function refresh() {
    setLoading(true);
    setError(null);
    setRefreshKey((value) => value + 1);
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await adminRequest<CatalogueHistoryPage>(`/api/admin/history?cursor=${encodeURIComponent(nextCursor)}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setEntries((previous) => [...previous, ...page.entries]);
      setNextCursor(page.nextCursor);
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError({
        message: failure instanceof Error ? failure.message : "Could not load older changes. Please try again.",
        reauth: failure instanceof AdminApiError && failure.status === 401,
      });
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }

  return <section className="admin-history" aria-label="Catalogue history" aria-busy={loading || loadingMore}>
    <div className="admin-history-intro">
      <div><History size={20} strokeWidth={1.5} aria-hidden="true" /><p>Every saved change, with the details that matter.</p></div>
      <button className="admin-button admin-button-secondary" onClick={refresh} disabled={loading || loadingMore}>
        <RefreshCw size={14} aria-hidden="true" /> Refresh history
      </button>
    </div>
    {error && <div className="admin-notice admin-notice-error" role="alert">
      <div>{error.message}{error.reauth && <Link href="/admin" target="_blank" rel="noopener noreferrer" className="admin-reauth-link">Sign in again <ArrowRight size={13} /></Link>}</div>
      {!entries.length && !error.reauth && <button className="admin-button admin-button-secondary" onClick={refresh}>Try again</button>}
    </div>}
    {loading ? <div className="admin-history-loading" role="status"><LoaderCircle className="admin-spin" size={22} aria-hidden="true" /> Loading saved changes…</div>
      : entries.length ? <>
        <ol className="admin-history-list">
          {entries.map((entry) => <li className="admin-history-entry" key={entry.id}>
            <div className="admin-history-entry-heading">
              <div><span className={`admin-history-action admin-history-action-${entry.action}`}>{actions[entry.action]}</span><h2>{entry.productName}</h2></div>
              <time dateTime={entry.occurredAt}><Clock3 size={12} aria-hidden="true" /> {dateFormat.format(new Date(entry.occurredAt))} IST</time>
            </div>
            <p className="admin-history-actor">{entry.actor ? <><strong>{entry.actor.name}</strong><span>{entry.actor.email}</span></> : "Owner identity unavailable"}</p>
            <div className="admin-history-changes-wrap"><table className="admin-history-changes">
              <caption className="sr-only">Previous and new values for {entry.productName}</caption>
              <thead><tr><th scope="col">What changed</th><th scope="col">Previous value</th><th scope="col">New value</th></tr></thead>
              <tbody>{entry.changes.map((change) => <tr key={change.field}>
                <th scope="row">{fields[change.field]}</th>
                <td><HistoryValue field={change.field} value={change.before} isNewProduct={entry.action === "create"} /></td>
                <td><HistoryValue field={change.field} value={change.after} /></td>
              </tr>)}</tbody>
            </table></div>
          </li>)}
        </ol>
        <div className="admin-history-footer">
          <span>{entries.length} saved {entries.length === 1 ? "change" : "changes"} shown · newest first</span>
          {nextCursor ? <button className="admin-button admin-button-secondary" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? <LoaderCircle className="admin-spin" size={15} aria-hidden="true" /> : <ArrowDown size={15} aria-hidden="true" />}
            {loadingMore ? "Loading older changes…" : "Load more"}
          </button> : <span>You’re up to date with the saved history.</span>}
        </div>
      </> : !error && <div className="admin-empty-state admin-history-empty">
        <History size={37} strokeWidth={1.1} aria-hidden="true" /><h2>Changes start here.</h2>
        <p>New products, price and availability updates, archives and restores will appear here when you save them. Earlier changes are not included.</p>
      </div>}
  </section>;
}

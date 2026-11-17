import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import CataloguePage from "@/components/catalogue-page";
import {
  parseCatalogueFilters,
  type CatalogueSearchParams,
} from "@/lib/catalogue-query";

export const metadata: Metadata = {
  title: "The Fish Counter — Sagar Live Fish",
  description:
    "Browse freshwater fish, sea catch, prawns and crabs. Search in English or Telugu, choose your cut and enquire with Sagar Live Fish.",
  alternates: { canonical: "/shop" },
};
async function Results({
  searchParams,
}: {
  searchParams: Promise<CatalogueSearchParams>;
}) {
  await connection();
  const filters = parseCatalogueFilters(await searchParams);
  return <CataloguePage key={JSON.stringify(filters)} filters={filters} />;
}
export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<CatalogueSearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <div className="page-loading container" role="status">
          Opening the fish counter…
        </div>
      }
    >
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

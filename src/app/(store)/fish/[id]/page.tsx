import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { database } from "@/lib/server/database";
import { getCatalogue } from "@/lib/server/catalogue";
import {
  parseCatalogueFilters,
  type CatalogueSearchParams,
} from "@/lib/catalogue-query";
import FishDetail from "@/components/fish-detail";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<CatalogueSearchParams>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const product = getCatalogue(database()).products.find(
    (product) => product.id === id,
  );
  if (!product)
    return {
      title: "Catch not found — Sagar Live Fish",
      robots: { index: false, follow: true },
    };
  return {
    title: `${product.nameEn} — Sagar Live Fish`,
    description: product.descEn,
    alternates: { canonical: `/fish/${encodeURIComponent(id)}` },
    openGraph: {
      title: `${product.nameEn} — Sagar Live Fish`,
      description: product.descEn,
      images: [
        {
          url: product.image || `/images/${product.id}.webp`,
          alt: product.nameEn,
        },
      ],
    },
  };
}
async function Catch({ params, searchParams }: Props) {
  await connection();
  const { id } = await params;
  const catalogue = getCatalogue(database());
  const product = catalogue.products.find((product) => product.id === id);
  if (!product) notFound();
  return (
    <FishDetail
      initialProduct={product}
      serverRevision={catalogue.revision}
      filters={parseCatalogueFilters(await searchParams)}
    />
  );
}
export default function FishPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="page-loading container" role="status">
          Preparing your catch…
        </div>
      }
    >
      <Catch {...props} />
    </Suspense>
  );
}

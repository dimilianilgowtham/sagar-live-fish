import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { database } from "@/lib/server/database";
import { getCatalogue } from "@/lib/server/catalogue";
import { StoreProvider } from "@/components/store-provider";
import SiteShell from "@/components/site-shell";
import BrandLogo from "@/components/brand-logo";
import "../storefront.css";

async function ConnectedStore({ children }: { children: ReactNode }) {
  await connection();
  return (
    <StoreProvider initialCatalogue={getCatalogue(database())}>
      <SiteShell>{children}</SiteShell>
    </StoreProvider>
  );
}
export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="storefront-loading" aria-busy="true">
          <BrandLogo />
          <h1>A fresh catch is on its way.</h1>
        </main>
      }
    >
      <ConnectedStore>{children}</ConnectedStore>
    </Suspense>
  );
}

import { Suspense } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import AdminDashboard from "@/components/admin/admin-dashboard";
import AdminAuth from "@/components/admin/admin-auth";
import { database } from "@/lib/server/database";
import { getCatalogue } from "@/lib/server/catalogue";
import { getOwner } from "@/lib/server/auth";
import { currentOwner } from "@/lib/server/http";
import { isLocalSetupAllowed } from "@/lib/server/request-security";
import { publicSiteOrigin } from "@/lib/server/production-config";

async function OwnerWorkspace() {
  await connection();
  const owner = await currentOwner();
  let publicSiteUrl: string | null = null;
  try { publicSiteUrl = publicSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL); } catch { /* QR downloads require the published URL. */ }
  if (owner)
    return (
      <AdminDashboard
        owner={owner}
        initialCatalogue={getCatalogue(database(), true)}
        publicSiteUrl={publicSiteUrl}
      />
    );
  const configured = getOwner(database());
  const local = isLocalSetupAllowed((await headers()).get("host"));
  return (
    <AdminAuth mode={configured ? "login" : local ? "setup" : "unavailable"} />
  );
}
export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="admin-loading" aria-busy="true">
          <span>SAGAR · OWNER STUDIO</span>
          <h1>Opening your counter…</h1>
        </main>
      }
    >
      <OwnerWorkspace />
    </Suspense>
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { database } from "@/lib/server/database";

// Check before a streaming layout sends headers, so missing listings keep 404.
export function proxy(request: NextRequest) {
  let id: string;
  try {
    id = decodeURIComponent(request.nextUrl.pathname.slice("/fish/".length));
  } catch {
    id = "";
  }
  const exists = database()
    .prepare("SELECT id FROM products WHERE id = ? AND archived = 0")
    .get(id);
  if (exists) return NextResponse.next();
  const destination = request.nextUrl.clone();
  destination.pathname = "/catch-unavailable";
  destination.search = "";
  return NextResponse.rewrite(destination, {
    status: 404,
    headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
  });
}

export const config = { matcher: "/fish/:id" };

import { connection } from "next/server";
import { database } from "@/lib/server/database";
import { json } from "@/lib/server/http";

export async function GET() {
  await connection();
  try {
    const state = database().prepare("SELECT revision FROM catalogue_state WHERE id = 1").get();
    if (!state) throw new Error("Catalogue is not initialised");
    return json({ status: "ok" });
  } catch {
    return json({ status: "unavailable" }, 503);
  }
}

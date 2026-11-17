import { connection } from "next/server";
import { database } from "@/lib/server/database";
import { getCatalogue } from "@/lib/server/catalogue";
import { api, json } from "@/lib/server/http";

export async function GET() {
  await connection();
  return api(() => json(getCatalogue(database())));
}

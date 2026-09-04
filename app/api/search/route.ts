import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { searchQuerySchema } from "@/lib/validation";
import { searchGames } from "@/lib/games";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = searchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    category: url.searchParams.get("category") ?? "",
    tag: url.searchParams.get("tag") ?? "",
    sort: url.searchParams.get("sort") ?? "popular",
    page: url.searchParams.get("page") ?? "1",
    pageSize: url.searchParams.get("pageSize") ?? "24",
  });
  if (!parsed.success) return jsonError("Invalid query", 400);

  const { slugs: _slugs, ...query } = parsed.data;
  const result = await searchGames({ ...query, publishedOnly: true });
  return NextResponse.json(result);
}

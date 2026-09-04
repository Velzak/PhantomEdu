import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getGamesRoot, mimeForFilename } from "@/lib/storage";

type Ctx = { params: { path: string[] } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const segments = params.path || [];
  if (segments.some((s) => s === ".." || s.includes("\\") || s.includes("\0"))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const root = getGamesRoot();
  const target = path.resolve(root, ...segments);
  if (target !== path.resolve(root) && !target.startsWith(path.resolve(root) + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(target);
    const filename = segments[segments.length - 1] || "index.html";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeForFilename(filename),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

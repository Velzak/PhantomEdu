import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getThumbsRoot, mimeForFilename } from "@/lib/storage";

type Ctx = { params: { path: string[] } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const segments = params.path || [];
  if (segments.some((s) => s === ".." || s.includes("\\") || s.includes("\0"))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const root = getThumbsRoot();
  // URL is /uploads/thumbnails/<file> — storage root is already the thumbnails folder,
  // so skip a leading "thumbnails" segment if present.
  const trimmed =
    segments[0] === "thumbnails" ? segments.slice(1) : segments;
  const target = path.resolve(root, ...trimmed);
  if (target !== path.resolve(root) && !target.startsWith(path.resolve(root) + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(target);
    const filename = trimmed[trimmed.length - 1] || "file";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeForFilename(filename),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

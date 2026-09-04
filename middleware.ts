import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimitMemory, clientIp } from "@/lib/rateLimit";

const ADMIN_PAGE_PREFIX = "/admin";
const LOGIN_PATH = "/admin/login";

function isPublicMutation(pathname: string, method: string) {
  if (method !== "POST") return false;
  if (/^\/api\/games\/[^/]+\/play$/.test(pathname)) return true;
  if (/^\/api\/games\/[^/]+\/rate$/.test(pathname)) return true;
  if (pathname === "/api/reports") return true;
  return false;
}

function needsAdmin(pathname: string, method: string) {
  if (pathname.startsWith(ADMIN_PAGE_PREFIX) && pathname !== LOGIN_PATH) return true;

  const mutating = method === "POST" || method === "PATCH" || method === "DELETE" || method === "PUT";
  if (!mutating) {
    if (pathname === "/api/reports" && method === "GET") return true;
    return false;
  }
  if (isPublicMutation(pathname, method)) return false;
  if (pathname.startsWith("/api/games")) return true;
  if (pathname.startsWith("/api/upload")) return true;
  if (pathname.startsWith("/api/reports")) return true;
  if (pathname.startsWith("/api/categories")) return true;
  if (pathname.startsWith("/api/tags")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  if (pathname === "/api/auth/callback/credentials" && method === "POST") {
    const ip = clientIp(req);
    const limited = rateLimitMemory(`login:${ip}`, 5, 10 * 60 * 1000);
    if (!limited.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in a few minutes." },
        { status: 429 }
      );
    }
  }

  if (!needsAdmin(pathname, method)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token?.id) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};

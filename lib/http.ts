import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function requireAdminResponse() {
  const session = await requireAdmin();
  if (!session) return { session: null, error: jsonError("Unauthorized", 401) };
  return { session, error: null };
}

export function assertSameOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) {
    // Same-origin navigations and some clients omit Origin; Host check still applies for fetch.
    return null;
  }
  const host = req.headers.get("host");
  try {
    const originHost = new URL(origin).host;
    if (host && originHost !== host) {
      return jsonError("Invalid origin", 403);
    }
  } catch {
    return jsonError("Invalid origin", 403);
  }
  return null;
}

export function parseJson<T>(input: unknown, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } } }) {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { data: null as T | null, error: jsonError("Invalid request", 400, { details: result.error.flatten() }) };
  }
  return { data: result.data, error: null };
}

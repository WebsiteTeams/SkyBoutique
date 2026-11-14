import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { rateLimit } from "./rate-limit";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const ok = (data: unknown = {}, status = 200) => NextResponse.json(data, { status });

type Ctx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: Ctx) => Promise<Response>;

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** CSRF defence in depth: cookies are SameSite=Lax; additionally reject cross-origin mutating requests. */
function checkOrigin(req: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError(403, "Invalid origin");
  }
  if (originHost !== host) throw new ApiError(403, "Cross-origin request blocked");
}

export function route(handler: Handler, opts: { limit?: number; windowMs?: number; key?: string; skipOrigin?: boolean } = {}): Handler {
  return async (req, ctx) => {
    try {
      if (!opts.skipOrigin) checkOrigin(req);
      const limit = opts.limit ?? (req.method === "GET" ? 240 : 60);
      const rl = rateLimit(`${opts.key ?? new URL(req.url).pathname}:${req.method}:${clientIp(req)}`, limit, opts.windowMs ?? 60_000);
      if (!rl.ok) {
        return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
      }
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message, details: e.details }, { status: e.status });
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: e.issues[0]?.message ?? "Invalid input", details: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
          { status: 400 },
        );
      }
      const err = e as { code?: number; keyPattern?: Record<string, unknown>; name?: string };
      if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern ?? {})[0] ?? "value";
        return NextResponse.json({ error: `That ${field} is already in use` }, { status: 409 });
      }
      if (err?.name === "CastError") return NextResponse.json({ error: "Invalid identifier" }, { status: 400 });
      console.error("[api]", e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  return schema.parse(json);
}

export const query = (req: Request) => new URL(req.url).searchParams;

export function paging(sp: URLSearchParams, defLimit = 20) {
  const page = Math.max(1, parseInt(sp.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || String(defLimit)) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

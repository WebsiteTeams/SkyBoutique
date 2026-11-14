import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Coarse gate for /admin/*. Authoritative checks still happen server-side in the admin layout and every /api/admin route.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const token = req.cookies.get("sky_session")?.value;
  let ok = false;
  if (token && process.env.JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      ok = payload.role === "admin";
    } catch {}
  }
  if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/admin/:path*"] };

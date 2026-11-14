import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import { User } from "@/models";
import { ApiError } from "./api";

const COOKIE = "sky_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET must be set (>= 32 chars)");
  return new TextEncoder().encode(s);
}

export type Session = { id: string; role: "customer" | "admin" };

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const verifyPassword = (p: string, h: string) => bcrypt.compare(p, h);

export async function createSession(user: { _id: unknown; role: string }) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user._id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: String(payload.sub), role: payload.role === "admin" ? "admin" : "customer" };
  } catch {
    return null;
  }
}

/** Loads the current user from DB so role / blocked status is always authoritative. */
export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  await connectDB();
  const u = await User.findById(s.id).select("-password -resetToken -resetExpires");
  if (!u || u.blocked) return null;
  return u;
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new ApiError(401, "Please sign in to continue");
  return u;
}

export async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) throw new ApiError(401, "Please sign in to continue");
  if (u.role !== "admin") throw new ApiError(403, "Administrator access required");
  return u;
}

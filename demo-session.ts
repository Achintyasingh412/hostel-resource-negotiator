import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { getDemoUserById, type DemoSessionUser } from "@/lib/demo-users";

const COOKIE_NAME = "hostel_demo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionKey() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required to sign demo sessions.");
  return new TextEncoder().encode(secret);
}

export async function createDemoSession(uid: string) {
  const user = getDemoUserById(uid);
  if (!user) throw new Error("Unknown demo account.");

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(getSessionKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "development" ? "none" : "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function getDemoSession(): Promise<DemoSessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionKey(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? getDemoUserById(payload.sub) : null;
  } catch {
    return null;
  }
}

export async function clearDemoSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export type { DemoSessionUser };

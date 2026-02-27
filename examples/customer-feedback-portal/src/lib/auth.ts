import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production"
);
const MAGIC_LINK_SECRET = new TextEncoder().encode(
  process.env.MAGIC_LINK_SECRET ??
    process.env.SESSION_SECRET ??
    "dev-secret-change-in-production"
);
const COOKIE_NAME = "feedback_session";

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: "session";
  exp: number;
}

export async function createSession(payload: Omit<SessionPayload, "exp">) {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    type: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export interface MagicLinkPayload extends JWTPayload {
  userId: string;
  email: string;
  type: "magic_link";
  exp: number;
}

export async function createMagicLinkToken(payload: {
  userId: string;
  email: string;
}) {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    type: "magic_link",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("20m")
    .setIssuedAt()
    .sign(MAGIC_LINK_SECRET);
}

async function verifyToken<TPayload extends JWTPayload>(
  token: string,
  secret: Uint8Array
): Promise<TPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as TPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken<SessionPayload>(token, SESSION_SECRET);
  if (
    !payload ||
    payload.type !== "session" ||
    !payload.userId ||
    !payload.email ||
    !payload.role
  ) {
    return null;
  }
  return payload;
}

export async function verifyMagicLinkToken(
  token: string
): Promise<MagicLinkPayload | null> {
  const payload = await verifyToken<MagicLinkPayload>(token, MAGIC_LINK_SECRET);
  if (!payload || payload.type !== "magic_link" || !payload.userId) {
    return null;
  }
  return payload;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireInternal(): Promise<SessionPayload> {
  const session = await requireAuth();
  if (session.role !== "internal") {
    throw new Error("Forbidden");
  }
  return session;
}

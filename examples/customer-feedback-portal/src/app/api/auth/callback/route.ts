import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyMagicLinkToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "missing_link");
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyMagicLinkToken(token);
  if (!payload?.userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid_link");
    return NextResponse.redirect(loginUrl);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.email !== payload.email) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid_link");
    return NextResponse.redirect(loginUrl);
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    type: "session",
  });

  return NextResponse.redirect(new URL("/problems", request.url));
}

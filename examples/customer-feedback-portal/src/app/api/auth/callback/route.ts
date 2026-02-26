import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production"
);

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.redirect(new URL("/problems", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

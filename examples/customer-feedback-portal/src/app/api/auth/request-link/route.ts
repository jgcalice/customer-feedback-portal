import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createMagicLinkToken } from "@/lib/auth";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const requestCounters = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_WINDOW = 6;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(key: string) {
  const now = Date.now();
  const current = requestCounters.get(key);

  if (!current || now > current.resetAt) {
    requestCounters.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  requestCounters.set(key, current);
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendMagicLinkEmail(to: string, magicLink: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;

  if (!resendApiKey || !resendFrom) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [to],
      subject: "Seu link de acesso ao Customer Feedback Portal",
      html: `<p>Use o link abaixo para entrar:</p><p><a href="${magicLink}">${magicLink}</a></p><p>Este link expira em 20 minutos.</p>`,
      text: `Use este link para entrar no Customer Feedback Portal: ${magicLink}\n\nEste link expira em 20 minutos.`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${details}`);
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a few minutes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // Keep auth friction low in MVP: unknown emails become customer users.
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        role: "customer",
      },
    });

    const token = await createMagicLinkToken({
      userId: user.id,
      email: user.email,
    });

    const magicLinkUrl = new URL("/api/auth/callback", request.nextUrl.origin);
    magicLinkUrl.searchParams.set("token", token);
    const magicLink = magicLinkUrl.toString();

    const sentByEmail = await sendMagicLinkEmail(user.email, magicLink).catch((e) => {
      console.error(e);
      return false;
    });

    if (!sentByEmail) {
      console.info(`[auth] Magic link for ${user.email}: ${magicLink}`);
    }

    const response: Record<string, unknown> = {
      ok: true,
      sentByEmail,
      message: "Magic link generated. Check your inbox.",
    };

    if (process.env.NODE_ENV !== "production") {
      response.magicLink = magicLink;
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

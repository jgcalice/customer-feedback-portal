import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createMagicLinkToken } from "@/lib/auth";
import { getI18nServer } from "@/i18n/server";

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

async function sendMagicLinkEmail(
  to: string,
  magicLink: string,
  subject: string,
  html: string,
  text: string
) {
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
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${details}`);
  }

  return true;
}

export async function POST(request: NextRequest) {
  const { t } = await getI18nServer();
  try {
    if (isRateLimited(getClientIp(request))) {
      return NextResponse.json(
        { error: t("api.tooManyRequests") },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: t("api.validEmailRequired") },
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

    const subject = t("api.magicLinkEmailSubject");
    const html = t("api.magicLinkEmailHtml", { magicLink });
    const text = t("api.magicLinkEmailText", { magicLink });
    const sentByEmail = await sendMagicLinkEmail(
      user.email,
      magicLink,
      subject,
      html,
      text
    ).catch((e) => {
      console.error(e);
      return false;
    });

    if (!sentByEmail) {
      console.info(`[auth] Magic link for ${user.email}: ${magicLink}`);
    }

    const response: Record<string, unknown> = {
      ok: true,
      sentByEmail,
      message: t("api.magicLinkGenerated"),
    };

    if (process.env.NODE_ENV !== "production") {
      response.magicLink = magicLink;
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: t("api.internalServerError") },
      { status: 500 }
    );
  }
}

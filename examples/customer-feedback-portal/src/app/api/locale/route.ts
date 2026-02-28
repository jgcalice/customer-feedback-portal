import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME } from "@/i18n/config";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { locale?: string };
    const locale = body?.locale;
    if (!locale || !isLocale(locale)) {
      return NextResponse.json({ error: "invalid locale" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true, locale });
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch {
    const response = NextResponse.json({ ok: true, locale: DEFAULT_LOCALE });
    response.cookies.set(LOCALE_COOKIE_NAME, DEFAULT_LOCALE, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }
}

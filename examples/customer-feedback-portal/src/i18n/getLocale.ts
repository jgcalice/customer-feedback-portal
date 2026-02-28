import { headers } from "next/headers";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME, type Locale } from "@/i18n/config";

function parseAcceptLanguage(value: string | null): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("pt-br") || normalized.startsWith("pt")) return "pt-BR";
  if (normalized.includes("en-us") || normalized.startsWith("en")) return "en-US";
  return null;
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (fromCookie && isLocale(fromCookie)) return fromCookie;

  const requestHeaders = await headers();
  const fromHeader = parseAcceptLanguage(requestHeaders.get("accept-language"));
  return fromHeader ?? DEFAULT_LOCALE;
}

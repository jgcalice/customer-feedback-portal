import { getLocale } from "@/i18n/getLocale";
import { MESSAGES, type Messages } from "@/i18n/messages";
import { translate } from "@/i18n/t";
import type { Locale } from "@/i18n/config";

export async function getI18nServer() {
  const locale = await getLocale();
  const messages = MESSAGES[locale] as Messages;
  return {
    locale,
    messages,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(messages, key, vars),
  };
}

export function getI18nByLocale(locale: Locale) {
  const messages = MESSAGES[locale] as Messages;
  return {
    locale,
    messages,
    t: (key: string, vars?: Record<string, string | number>) =>
      translate(messages, key, vars),
  };
}

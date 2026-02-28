"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/LocaleProvider";

export function LanguageToggle() {
  const { locale, t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onChange(nextLocale: Locale) {
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });
      router.refresh();
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span>{t("language.label")}</span>
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        disabled={isPending}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>
            {value === "pt-BR" ? t("language.ptBR") : t("language.enUS")}
          </option>
        ))}
      </select>
    </label>
  );
}

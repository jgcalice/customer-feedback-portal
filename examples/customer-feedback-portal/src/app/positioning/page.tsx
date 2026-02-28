import { getI18nServer } from "@/i18n/server";

export default async function PositioningPage() {
  const { t } = await getI18nServer();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("positioning.title")}</h1>
      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <section>
          <h2 className="mb-2 font-semibold text-card-foreground">{t("positioning.principles")}</h2>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            <li>{t("positioning.principle1")}</li>
            <li>{t("positioning.principle2")}</li>
            <li>{t("positioning.principle3")}</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-card-foreground">{t("positioning.currentFocus")}</h2>
          <p className="text-muted-foreground">
            {t("positioning.currentFocusText")}
          </p>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/i18n/LocaleProvider";

type RoadmapItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetMonthOrQuarter: string | null;
  product: { name: string };
  problemRoadmap: { problem: { title: string } }[];
};

type RoadmapByProduct = Record<string, RoadmapItem[]>;

export default function RoadmapPage() {
  const [data, setData] = useState<RoadmapByProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError(t("roadmap.failedToLoad")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  if (error) return <p className="text-destructive">{error}</p>;


  const products = Object.keys(data ?? {});

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("roadmap.title")}</h1>
      <p className="mb-6 text-muted-foreground">
        {t("roadmap.subtitle")}
      </p>

      {products.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
          {t("roadmap.noItems")}
        </div>
      ) : (
        <div className="space-y-8">
          {products.map((productName) => (
            <section key={productName}>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{productName}</h2>
              <ul className="space-y-4">
                {(data ?? {})[productName].map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                      <div>
                        <h3 className="font-medium text-card-foreground">{item.title}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        {item.problemRoadmap.length > 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {t("common.related")}{" "}
                            {item.problemRoadmap
                              .map((pr) => pr.problem.title)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <StatusBadge status={item.status} />
                        {item.targetMonthOrQuarter &&
                          <span className="text-muted-foreground">
                            {item.targetMonthOrQuarter}
                          </span>}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

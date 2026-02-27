"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";

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

  useEffect(() => {
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load roadmap"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-600">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;


  const products = Object.keys(data ?? {});

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Roadmap</h1>
      <p className="mb-6 text-zinc-600">
        Planned and in-progress items by product. Dates are indicative.
      </p>

      {products.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-zinc-600">
          No roadmap items yet.
        </div>
      ) : (
        <div className="space-y-8">
          {products.map((productName) => (
            <section key={productName}>
              <h2 className="mb-4 text-lg font-semibold">{productName}</h2>
              <ul className="space-y-4">
                {(data ?? {})[productName].map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-zinc-600">
                            {item.description}
                          </p>
                        )}
                        {item.problemRoadmap.length > 0 && (
                          <p className="mt-2 text-xs text-zinc-500">
                            Related:{" "}
                            {item.problemRoadmap
                              .map((pr) => pr.problem.title)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <StatusBadge status={item.status} />
                        {item.targetMonthOrQuarter &&
                          <span className="text-zinc-500">
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

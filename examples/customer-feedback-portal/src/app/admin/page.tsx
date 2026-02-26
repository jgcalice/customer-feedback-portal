"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Problem = {
  id: string;
  title: string;
  status: string;
  product: { name: string };
  _count: { interests: number };
};

type Product = { id: string; name: string };

type RoadmapItem = {
  id: string;
  title: string;
  status: string;
  product: { name: string };
};

export default function AdminPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roadmapForm, setRoadmapForm] = useState({
    productId: "",
    title: "",
    description: "",
    status: "planned",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== "internal") {
          router.push("/problems");
          return Promise.reject(new Error("Forbidden"));
        }
        return Promise.all([
          fetch("/api/problems").then((r) => r.json()),
          fetch("/api/products").then((r) => r.json()),
          fetch("/api/roadmap").then((r) => r.json()),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [problems, products, roadmapData] = result;
        setProblems(problems);
        setProducts(products);
        const items: RoadmapItem[] = [];
        Object.values(roadmapData as Record<string, RoadmapItem[]>).forEach(
          (arr) => items.push(...arr)
        );
        setRoadmap(items);
      })
      .catch((e) => {
        if (e?.message === "Forbidden") return;
        if (e?.message?.includes("403") || e?.message?.includes("401")) {
          router.push("/login");
        } else {
          setError("Failed to load");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function updateStatus(problemId: string, status: string) {
    try {
      const res = await fetch(
        `/api/admin/problems/${problemId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        throw new Error("Failed");
      }
      const updated = await res.json();
      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? updated : p))
      );
    } catch {
      setError("Failed to update status");
    }
  }

  async function addRoadmapItem(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roadmapForm),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        throw new Error(data.error ?? "Failed");
      }
      const item = await res.json();
      setRoadmap((prev) => [...prev, item]);
      setRoadmapForm({
        productId: products[0]?.id ?? "",
        title: "",
        description: "",
        status: "planned",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-zinc-600">Loading...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin</h1>
      <p className="mb-6 text-zinc-600">
        Update problem status and manage roadmap. Internal only.
      </p>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Add Roadmap Item</h2>
        <form
          onSubmit={addRoadmapItem}
          className="flex flex-wrap gap-4 rounded-lg border bg-white p-4"
        >
          <select
            value={roadmapForm.productId}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, productId: e.target.value })
            }
            required
            className="rounded border border-zinc-300 px-3 py-2"
          >
            <option value="">Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Title"
            value={roadmapForm.title}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, title: e.target.value })
            }
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={roadmapForm.description}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, description: e.target.value })
            }
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <select
            value={roadmapForm.status}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, status: e.target.value })
            }
            className="rounded border border-zinc-300 px-3 py-2"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
            <option value="delivered">Delivered</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Update Problem Status</h2>
        {problems.length === 0 ? (
          <p className="text-zinc-600">No problems yet.</p>
        ) : (
          <ul className="space-y-4">
            {problems.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border bg-white p-4"
              >
                <div>
                  <Link
                    href={`/problems/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="text-sm text-zinc-600">
                    {p.product.name} · {p._count.interests} me afeta
                  </p>
                </div>
                <select
                  value={p.status}
                  onChange={(e) =>
                    updateStatus(p.id, e.target.value)
                  }
                  className="rounded border border-zinc-300 px-3 py-2"
                >
                  <option value="new">New</option>
                  <option value="evaluating">Evaluating</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="delivered">Delivered</option>
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Roadmap Items</h2>
        {roadmap.length === 0 ? (
          <p className="text-zinc-600">No roadmap items yet.</p>
        ) : (
          <ul className="space-y-2">
            {roadmap.map((r) => (
              <li
                key={r.id}
                className="rounded border bg-white p-3"
              >
                {r.title} ({r.product.name}) · {r.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

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
  targetMonthOrQuarter: string | null;
  product: { name: string };
  problemRoadmap?: { problem: { id: string; title: string } }[];
};

export default function AdminPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roadmapForm, setRoadmapForm] = useState({
    productId: "",
    title: "",
    description: "",
    status: "planned",
    targetMonthOrQuarter: "",
    relatedProblemId: "",
  });
  const [mergeForm, setMergeForm] = useState({
    targetProblemId: "",
    duplicateProblemId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);
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
        const [problemsData, productsData, roadmapData] = result;
        setProblems(problemsData);
        setProducts(productsData);
        const items: RoadmapItem[] = [];
        Object.values(roadmapData as Record<string, RoadmapItem[]>).forEach(
          (arr) => items.push(...arr)
        );
        setRoadmap(items);
        setRoadmapForm((prev) => ({
          ...prev,
          productId: prev.productId || productsData[0]?.id || "",
        }));
        setMergeForm((prev) => ({
          targetProblemId: prev.targetProblemId || problemsData[0]?.id || "",
          duplicateProblemId:
            prev.duplicateProblemId || problemsData[1]?.id || "",
        }));
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
      setError("");
      setSuccess("");
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
      setSuccess("Problem status updated.");
    } catch {
      setError("Failed to update status");
    }
  }

  async function addRoadmapItem(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: roadmapForm.productId,
          title: roadmapForm.title,
          description: roadmapForm.description,
          status: roadmapForm.status,
          targetMonthOrQuarter: roadmapForm.targetMonthOrQuarter,
          problemIds: roadmapForm.relatedProblemId
            ? [roadmapForm.relatedProblemId]
            : [],
        }),
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
      setSuccess("Roadmap item added.");
      setRoadmapForm({
        productId: products[0]?.id ?? "",
        title: "",
        description: "",
        status: "planned",
        targetMonthOrQuarter: "",
        relatedProblemId: "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function mergeDuplicateProblems(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const targetProblemId = mergeForm.targetProblemId;
    const duplicateProblemId = mergeForm.duplicateProblemId;
    if (!targetProblemId || !duplicateProblemId) {
      setError("Select both target and duplicate problem.");
      return;
    }
    if (targetProblemId === duplicateProblemId) {
      setError("Target and duplicate must be different.");
      return;
    }

    setMergeSubmitting(true);
    try {
      const res = await fetch(`/api/admin/problems/${targetProblemId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateProblemId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        throw new Error(data.error ?? "Failed to merge");
      }

      setProblems((prev) =>
        prev
          .filter((p) => p.id !== data.mergedProblemId)
          .map((p) => (p.id === data.problem.id ? data.problem : p))
      );
      setSuccess("Problems merged successfully.");
      setMergeForm((prev) => ({
        ...prev,
        duplicateProblemId: "",
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to merge");
    } finally {
      setMergeSubmitting(false);
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
      {success && <p className="mb-4 text-emerald-700">{success}</p>}

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
          <input
            type="text"
            placeholder="Target (e.g. 2026-Q2)"
            value={roadmapForm.targetMonthOrQuarter}
            onChange={(e) =>
              setRoadmapForm({
                ...roadmapForm,
                targetMonthOrQuarter: e.target.value,
              })
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
          <select
            value={roadmapForm.relatedProblemId}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, relatedProblemId: e.target.value })
            }
            className="rounded border border-zinc-300 px-3 py-2"
          >
            <option value="">No related problem</option>
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
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

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Merge Duplicates</h2>
        {problems.length < 2 ? (
          <p className="text-zinc-600">
            Need at least two problems to run a merge.
          </p>
        ) : (
          <form
            onSubmit={mergeDuplicateProblems}
            className="flex flex-wrap gap-4 rounded-lg border bg-white p-4"
          >
            <select
              value={mergeForm.targetProblemId}
              onChange={(e) =>
                setMergeForm({ ...mergeForm, targetProblemId: e.target.value })
              }
              required
              className="rounded border border-zinc-300 px-3 py-2"
            >
              <option value="">Target problem (keep)</option>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <select
              value={mergeForm.duplicateProblemId}
              onChange={(e) =>
                setMergeForm({
                  ...mergeForm,
                  duplicateProblemId: e.target.value,
                })
              }
              required
              className="rounded border border-zinc-300 px-3 py-2"
            >
              <option value="">Duplicate problem (remove)</option>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={mergeSubmitting}
              className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {mergeSubmitting ? "Merging..." : "Merge"}
            </button>
          </form>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {r.title} <span className="text-zinc-500">({r.product.name})</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.targetMonthOrQuarter && (
                      <span className="text-xs text-zinc-500">
                        {r.targetMonthOrQuarter}
                      </span>
                    )}
                  </div>
                </div>
                {r.problemRoadmap && r.problemRoadmap.length > 0 && (
                  <p className="mt-2 text-sm text-zinc-600">
                    Related:{" "}
                    {r.problemRoadmap.map((item) => item.problem.title).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

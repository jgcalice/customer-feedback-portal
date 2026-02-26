"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ToastProvider";

type Problem = {
  id: string;
  title: string;
  status: string;
  product: { name: string };
  _count: { interests: number; comments: number };
  hasInterest: boolean;
};

type Product = { id: string; name: string };

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [productId, setProductId] = useState(() => searchParams.get("productId") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "");
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setError("Failed to load products"));
  }, []);

  useEffect(() => {
    setProductId(searchParams.get("productId") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, productId, router, search, searchParams, status]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    fetch(`/api/problems?${params.toString()}`)
      .then((r) => r.json())
      .then(setProblems)
      .catch(() => setError("Failed to load problems"))
      .finally(() => setLoading(false));
  }, [productId, status, search]);

  async function toggleInterest(problem: Problem) {
    setError("");
    setInfo("");
    setTogglingId(problem.id);
    try {
      const method = problem.hasInterest ? "DELETE" : "POST";
      const res = await fetch(`/api/problems/${problem.id}/interest`, { method });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(data.error ?? "Failed");
      }

      const nextCount =
        data?._count?.interests ??
        problem._count.interests + (problem.hasInterest ? -1 : 1);
      const nextComments = data?._count?.comments ?? problem._count.comments;
      setProblems((prev) =>
        prev.map((item) =>
          item.id === problem.id
            ? {
                ...item,
                hasInterest: !problem.hasInterest,
                _count: {
                  interests: nextCount,
                  comments: nextComments,
                },
              }
            : item
        )
      );
      setInfo(
        !problem.hasInterest
          ? "Marcado como 'me afeta'."
          : "Marcacao removida."
      );
      addToast({
        tone: "success",
        title: !problem.hasInterest ? "Interesse registrado" : "Interesse removido",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      addToast({
        tone: "error",
        title: "Falha ao atualizar interesse",
        description: message,
      });
    } finally {
      setTogglingId("");
    }
  }

  function clearFilters() {
    setProductId("");
    setStatus("");
    setSearch("");
  }

  const totalInterests = problems.reduce((acc, item) => acc + item._count.interests, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Problems</h1>
        <Link
          href="/problems/new"
          className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800"
        >
          New Problem
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">Visible problems</p>
          <p className="mt-1 text-2xl font-semibold">{problems.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">Total “me afeta”</p>
          <p className="mt-1 text-2xl font-semibold">{totalInterests}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">My interests</p>
          <p className="mt-1 text-2xl font-semibold">
            {problems.filter((item) => item.hasInterest).length}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <label htmlFor="product-filter" className="sr-only">
          Filter by product
        </label>
        <select
          id="product-filter"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <label htmlFor="status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="evaluating">Evaluating</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="delivered">Delivered</option>
        </select>
        <label htmlFor="search-filter" className="sr-only">
          Search problems
        </label>
        <input
          id="search-filter"
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2"
        />
        <button
          type="button"
          onClick={clearFilters}
          className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Clear filters
        </button>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {info && <p className="mb-4 text-emerald-700" aria-live="polite">{info}</p>}

      {loading ? (
        <p className="text-zinc-600">Loading...</p>
      ) : problems.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-zinc-600">
          No problems found.{" "}
          <Link href="/problems/new" className="font-medium hover:underline">
            Submit one
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {problems.map((p) => (
            <li key={p.id}>
              <div className="rounded-lg border bg-white p-4 transition hover:border-zinc-400">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/problems/${p.id}`} className="min-w-0 flex-1">
                    <h2 className="font-semibold">{p.title}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                      <span>{p.product.name}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleInterest(p)}
                    disabled={togglingId === p.id}
                    aria-label={
                      p.hasInterest
                        ? `Remove interest for ${p.title}`
                        : `Mark ${p.title} as affecting me`
                    }
                    className={`rounded px-3 py-1.5 text-sm font-medium ${
                      p.hasInterest
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    } disabled:opacity-50`}
                  >
                    {togglingId === p.id
                      ? "..."
                      : p.hasInterest
                        ? "✓ Me afeta"
                        : "Me afeta"}
                  </button>
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  {p._count.interests} pessoas marcadas · {p._count.comments} comentarios
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

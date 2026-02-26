"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ToastProvider";

type ProblemSort = "recent" | "most_interested" | "most_commented";

const SORT_OPTIONS: Array<{ value: ProblemSort; label: string }> = [
  { value: "recent", label: "Most recent" },
  { value: "most_interested", label: "Most interested" },
  { value: "most_commented", label: "Most commented" },
];

type Problem = {
  id: string;
  title: string;
  status: string;
  product: { name: string };
  _count: { interests: number; comments: number };
  hasInterest: boolean;
};

type Product = { id: string; name: string };

type ProblemsResponse = {
  items: Problem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    sort: ProblemSort;
  };
};

function parsePage(value: string | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

function parseSort(value: string | null): ProblemSort {
  if (value === "most_interested" || value === "most_commented") {
    return value;
  }
  return "recent";
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<ProblemSort>("recent");
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [meta, setMeta] = useState<ProblemsResponse["meta"]>({
    page: 1,
    pageSize: 6,
    total: 0,
    totalPages: 1,
    sort: "recent",
  });
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setError("Failed to load products"));
  }, []);

  useEffect(() => {
    const nextProductId = searchParams.get("productId") ?? "";
    const nextStatus = searchParams.get("status") ?? "";
    const nextSort = parseSort(searchParams.get("sort"));
    const nextPage = parsePage(searchParams.get("page"));
    const nextSearch = searchParams.get("search") ?? "";

    setProductId(nextProductId);
    setStatus(nextStatus);
    setSort(nextSort);
    setPage(nextPage);
    setSearchDraft(nextSearch);
    setSearchQuery(nextSearch);
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextQuery = searchDraft.trim();
      setSearchQuery((currentQuery) => {
        if (currentQuery === nextQuery) {
          return currentQuery;
        }
        setPage(1);
        return nextQuery;
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchDraft]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (status) params.set("status", status);
    if (searchQuery) params.set("search", searchQuery);
    if (sort !== "recent") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [page, pathname, productId, router, searchParams, searchQuery, sort, status]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.set("paginated", "1");
    params.set("page", String(page));
    params.set("pageSize", "6");
    params.set("sort", sort);
    if (productId) params.set("productId", productId);
    if (status) params.set("status", status);
    if (searchQuery) params.set("search", searchQuery);
    fetch(`/api/problems?${params.toString()}`)
      .then((r) => r.json() as Promise<ProblemsResponse>)
      .then((data) => {
        setProblems(data.items ?? []);
        if (data.meta) {
          setMeta(data.meta);
          if (data.meta.page !== page) {
            setPage(data.meta.page);
          }
        }
      })
      .catch(() => setError("Failed to load problems"))
      .finally(() => setLoading(false));
  }, [page, productId, refreshKey, searchQuery, sort, status]);

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
      if (sort !== "recent") {
        setRefreshKey((value) => value + 1);
      }
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
    setSort("recent");
    setPage(1);
    setSearchDraft("");
    setSearchQuery("");
    setInfo("Filters cleared.");
    addToast({
      tone: "info",
      title: "Filtros limpos",
    });
  }

  const totalInterests = useMemo(
    () => problems.reduce((acc, item) => acc + item._count.interests, 0),
    [problems]
  );
  const fromItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const toItem = meta.total === 0 ? 0 : Math.min(meta.total, meta.page * meta.pageSize);

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
          <p className="text-xs text-zinc-500">Matching problems</p>
          <p className="mt-1 text-2xl font-semibold">{meta.total}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">“Me afeta” in current page</p>
          <p className="mt-1 text-2xl font-semibold">{totalInterests}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-zinc-500">My interests (current page)</p>
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
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2"
        />
        <label htmlFor="sort-filter" className="sr-only">
          Sort problems
        </label>
        <select
          id="sort-filter"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as ProblemSort);
            setPage(1);
          }}
          className="rounded border border-zinc-300 px-3 py-2"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Clear filters
        </button>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {info && (
        <p className="mb-4 text-emerald-700" aria-live="polite">
          {info}
        </p>
      )}

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
        <div>
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

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3">
            <p className="text-sm text-zinc-600">
              Showing {fromItem}-{toItem} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-700">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={meta.page >= meta.totalPages}
                onClick={() =>
                  setPage((current) => Math.min(meta.totalPages, current + 1))
                }
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ToastProvider";

type ProblemSort = "recent" | "most_interested" | "most_commented";
type PaginationToken = number | "left-ellipsis" | "right-ellipsis";

const SORT_OPTIONS: Array<{ value: ProblemSort; label: string }> = [
  { value: "recent", label: "Most recent" },
  { value: "most_interested", label: "Most interested" },
  { value: "most_commented", label: "Most commented" },
];
const PAGE_SIZE_OPTIONS = [6, 12, 24];

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

function parsePageSize(value: string | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!PAGE_SIZE_OPTIONS.includes(parsed)) return 6;
  return parsed;
}

function parseBoolean(value: string | null) {
  return value === "1" || value === "true";
}

function parseSort(value: string | null): ProblemSort {
  if (value === "most_interested" || value === "most_commented") {
    return value;
  }
  return "recent";
}

function getPaginationTokens(currentPage: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "right-ellipsis", totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, "left-ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "left-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "right-ellipsis",
    totalPages,
  ];
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<ProblemSort>("recent");
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
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

    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setIsAuthenticated(!!data.user))
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    const nextProductId = searchParams.get("productId") ?? "";
    const nextStatus = searchParams.get("status") ?? "";
    const nextSortParam = searchParams.get("sort");
    let nextSort = parseSort(nextSortParam);
    if (!nextSortParam) {
      const savedSort = parseSort(window.localStorage.getItem("problems.sort"));
      nextSort = savedSort;
    }
    const nextPage = parsePage(searchParams.get("page"));
    const nextPageSizeParam = searchParams.get("pageSize");
    let nextPageSize = parsePageSize(nextPageSizeParam);
    if (!nextPageSizeParam) {
      nextPageSize = parsePageSize(window.localStorage.getItem("problems.pageSize"));
    }
    const nextSearch = searchParams.get("search") ?? "";
    const nextMineOnly = parseBoolean(searchParams.get("mine"));

    setProductId(nextProductId);
    setStatus(nextStatus);
    setSort(nextSort);
    setMineOnly(nextMineOnly);
    setPage(nextPage);
    setPageSize(nextPageSize);
    setSearchDraft(nextSearch);
    setSearchQuery(nextSearch);
  }, [searchParams]);

  useEffect(() => {
    window.localStorage.setItem("problems.sort", sort);
  }, [sort]);

  useEffect(() => {
    window.localStorage.setItem("problems.pageSize", String(pageSize));
  }, [pageSize]);

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
    if (mineOnly) params.set("mine", "1");
    if (sort !== "recent") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 6) params.set("pageSize", String(pageSize));

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [
    mineOnly,
    page,
    pageSize,
    pathname,
    productId,
    router,
    searchParams,
    searchQuery,
    sort,
    status,
  ]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.set("paginated", "1");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("sort", sort);
    if (productId) params.set("productId", productId);
    if (status) params.set("status", status);
    if (searchQuery) params.set("search", searchQuery);
    if (mineOnly) params.set("mine", "1");
    fetch(`/api/problems?${params.toString()}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error ?? "Failed to load problems");
        }
        return data as ProblemsResponse;
      })
      .then((data) => {
        setProblems(data.items ?? []);
        if (data.meta) {
          setMeta(data.meta);
          if (data.meta.page !== page) {
            setPage(data.meta.page);
          }
        }
      })
      .catch((e) => {
        const message = e instanceof Error ? e.message : "Failed to load problems";
        setError(message);
        if (mineOnly && message.toLowerCase().includes("login")) {
          setMineOnly(false);
          addToast({
            tone: "info",
            title: "Login required",
            description: "Use login to filter by your own interests.",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [addToast, mineOnly, page, pageSize, productId, refreshKey, searchQuery, sort, status]);

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
    setMineOnly(false);
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
  const paginationTokens = useMemo(
    () => getPaginationTokens(meta.page, meta.totalPages),
    [meta.page, meta.totalPages]
  );

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
          onChange={(e) => {
            setProductId(e.target.value);
            setPage(1);
          }}
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
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
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
        <label htmlFor="mine-filter" className="inline-flex items-center gap-2 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
          <input
            id="mine-filter"
            type="checkbox"
            checked={mineOnly}
            disabled={!isAuthenticated}
            onChange={(e) => {
              setMineOnly(e.target.checked);
              setPage(1);
            }}
          />
          Only my interests
        </label>
        {!isAuthenticated && (
          <Link
            href="/login"
            className="self-center text-sm text-zinc-600 underline hover:text-zinc-800"
          >
            Login to enable
          </Link>
        )}
        <label htmlFor="page-size-filter" className="sr-only">
          Items per page
        </label>
        <select
          id="page-size-filter"
          value={pageSize}
          onChange={(e) => {
            setPageSize(parsePageSize(e.target.value));
            setPage(1);
          }}
          className="rounded border border-zinc-300 px-3 py-2"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} per page
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                Previous
              </button>
              {paginationTokens.map((token) =>
                typeof token === "number" ? (
                  <button
                    key={token}
                    type="button"
                    onClick={() => setPage(token)}
                    aria-current={token === meta.page ? "page" : undefined}
                    className={`rounded border px-3 py-1.5 text-sm font-medium ${
                      token === meta.page
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {token}
                  </button>
                ) : (
                  <span
                    key={token}
                    className="px-1 text-sm text-zinc-500"
                    aria-hidden="true"
                  >
                    ...
                  </span>
                )
              )}
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/i18n/LocaleProvider";

type ProblemSort = "recent" | "most_interested" | "most_commented";
type PaginationToken = number | "left-ellipsis" | "right-ellipsis";

const DEFAULT_PAGE_SIZE = 6;
const SORT_OPTIONS: Array<{ value: ProblemSort }> = [
  { value: "recent" },
  { value: "most_interested" },
  { value: "most_commented" },
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

type ProblemsFilterState = {
  productId: string;
  status: string;
  search: string;
  sort: ProblemSort;
  mineOnly: boolean;
  pageSize: number;
};

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

type SavedProblemView = {
  id: string;
  name: string;
  productId: string | null;
  status: string | null;
  search: string | null;
  sort: string;
  mineOnly: boolean;
  pageSize: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

function parsePage(value: string | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

function parsePageSize(value: string | null) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!PAGE_SIZE_OPTIONS.includes(parsed)) return DEFAULT_PAGE_SIZE;
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

function buildQueryFromFilters(filters: ProblemsFilterState, page: number) {
  const params = new URLSearchParams();
  if (filters.productId) params.set("productId", filters.productId);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.mineOnly) params.set("mine", "1");
  if (filters.sort !== "recent") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  if (filters.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(filters.pageSize));
  }
  return params;
}

function normalizeViewSort(value: string): ProblemSort {
  return parseSort(value);
}

function sortViews(views: SavedProblemView[]) {
  return [...views].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) {
      return Number(b.isFavorite) - Number(a.isFavorite);
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function viewToFilters(view: SavedProblemView): ProblemsFilterState {
  return {
    productId: view.productId ?? "",
    status: view.status ?? "",
    search: view.search ?? "",
    sort: normalizeViewSort(view.sort),
    mineOnly: view.mineOnly,
    pageSize: parsePageSize(String(view.pageSize)),
  };
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
  const [authResolved, setAuthResolved] = useState(false);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const [workspaceViews, setWorkspaceViews] = useState<SavedProblemView[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceFavorite, setWorkspaceFavorite] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceMutatingId, setWorkspaceMutatingId] = useState("");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialQueryRef = useRef<string | null>(null);
  if (initialQueryRef.current === null) {
    initialQueryRef.current = searchParams.toString();
  }
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
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    sort: "recent",
  });
  const router = useRouter();
  const { addToast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setError(t("api.internalServerError")));

    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setIsAuthenticated(!!data.user))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setAuthResolved(true));
  }, [t]);

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
    if (!authResolved) return;

    if (!isAuthenticated) {
      setPreferencesHydrated(true);
      return;
    }

    let active = true;
    setWorkspaceLoading(true);

    Promise.all([
      fetch("/api/me/preferences/problems").then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(t("api.internalServerError")))
      ),
      fetch("/api/me/workspace/views").then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(t("api.internalServerError")))
      ),
    ])
      .then(([preferencePayload, viewsPayload]) => {
        if (!active) return;

        const preferences = preferencePayload.preferences as Partial<ProblemsFilterState> | undefined;
        if (initialQueryRef.current === "" && preferences) {
          setProductId(preferences.productId ?? "");
          setStatus(preferences.status ?? "");
          setSearchDraft(preferences.search ?? "");
          setSearchQuery(preferences.search ?? "");
          setSort(parseSort(preferences.sort ?? "recent"));
          setMineOnly(Boolean(preferences.mineOnly));
          setPageSize(parsePageSize(String(preferences.pageSize ?? DEFAULT_PAGE_SIZE)));
          setPage(1);
        }

        const views = Array.isArray(viewsPayload.views)
          ? (viewsPayload.views as SavedProblemView[])
          : [];
        setWorkspaceViews(sortViews(views));
      })
      .catch((e) => {
        if (!active) return;
        console.error(e);
        addToast({
          tone: "error",
          title: t("toast.workspaceLoadErrorTitle"),
        });
      })
      .finally(() => {
        if (!active) return;
        setWorkspaceLoading(false);
        setPreferencesHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [addToast, authResolved, isAuthenticated]);

  useEffect(() => {
    window.localStorage.setItem("problems.sort", sort);
  }, [sort]);

  useEffect(() => {
    window.localStorage.setItem("problems.pageSize", String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    if (!preferencesHydrated) return;

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
  }, [preferencesHydrated, searchDraft]);

  useEffect(() => {
    if (!preferencesHydrated) return;

    const params = buildQueryFromFilters(
      {
        productId,
        status,
        search: searchQuery,
        sort,
        mineOnly,
        pageSize,
      },
      page
    );

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
    preferencesHydrated,
  ]);

  useEffect(() => {
    if (!preferencesHydrated) return;

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
          throw new Error(data.error ?? t("api.internalServerError"));
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
        const message = e instanceof Error ? e.message : t("api.internalServerError");
        setError(message);
        if (mineOnly && message.toLowerCase().includes("login")) {
          setMineOnly(false);
          addToast({
            tone: "info",
            title: t("toast.loginRequiredTitle"),
            description: t("toast.loginRequiredDesc"),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [
    addToast,
    mineOnly,
    page,
    pageSize,
    preferencesHydrated,
    productId,
    refreshKey,
    searchQuery,
    sort,
    status,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !preferencesHydrated) return;

    const timeout = window.setTimeout(() => {
      void fetch("/api/me/preferences/problems", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          status,
          search: searchQuery,
          sort,
          mineOnly,
          pageSize,
        }),
      }).catch((e) => {
        console.error(e);
      });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [
    isAuthenticated,
    mineOnly,
    pageSize,
    preferencesHydrated,
    productId,
    searchQuery,
    sort,
    status,
  ]);

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
        throw new Error(data.error ?? t("api.internalServerError"));
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
      setInfo(!problem.hasInterest ? t("toast.interestAddedDesc") : t("toast.interestRemovedDesc"));
      addToast({
        tone: "success",
        title: !problem.hasInterest ? t("toast.interestAddedTitle") : t("toast.interestRemovedTitle"),
      });
      if (sort !== "recent") {
        setRefreshKey((value) => value + 1);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t("login.genericError");
      setError(message);
      addToast({
        tone: "error",
        title: t("toast.interestUpdateErrorTitle"),
        description: message,
      });
    } finally {
      setTogglingId("");
    }
  }

  async function saveCurrentView(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast({
        tone: "info",
        title: t("toast.loginRequiredTitle"),
        description: t("toast.loginRequiredDesc"),
      });
      router.push("/login");
      return;
    }

      const name = workspaceName.trim() || `View ${new Date().toLocaleDateString()}`;
    setWorkspaceSaving(true);
    try {
      const res = await fetch("/api/me/workspace/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          productId,
          status,
          search: searchQuery,
          sort,
          mineOnly,
          pageSize,
          isFavorite: workspaceFavorite,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? t("api.internalServerError"));
      }

      setWorkspaceViews((prev) => sortViews([data as SavedProblemView, ...prev]));
      setWorkspaceName("");
      setWorkspaceFavorite(false);
      addToast({
        tone: "success",
        title: t("toast.viewSavedTitle"),
        description: t("toast.viewSavedDesc", { name }),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : t("api.internalServerError");
      addToast({
        tone: "error",
        title: t("toast.saveViewErrorTitle"),
        description: message,
      });
    } finally {
      setWorkspaceSaving(false);
    }
  }

  function applySavedView(view: SavedProblemView) {
    const filters = viewToFilters(view);
    setProductId(filters.productId);
    setStatus(filters.status);
    setSearchDraft(filters.search);
    setSearchQuery(filters.search);
    setSort(filters.sort);
    setMineOnly(filters.mineOnly);
    setPageSize(filters.pageSize);
    setPage(1);
    setInfo(t("toast.viewAppliedTitle"));
    addToast({
      tone: "info",
      title: t("toast.viewAppliedTitle"),
      description: view.name,
    });
  }

  async function toggleViewFavorite(view: SavedProblemView) {
    setWorkspaceMutatingId(view.id);
    try {
      const res = await fetch(`/api/me/workspace/views/${view.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !view.isFavorite }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? t("api.internalServerError"));
      }
      setWorkspaceViews((prev) =>
        sortViews(prev.map((item) => (item.id === view.id ? (data as SavedProblemView) : item)))
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : t("api.internalServerError");
      addToast({
        tone: "error",
        title: t("toast.favoriteUpdateErrorTitle"),
        description: message,
      });
    } finally {
      setWorkspaceMutatingId("");
    }
  }

  async function deleteSavedView(view: SavedProblemView) {
    if (!window.confirm(`${t("problems.delete")} "${view.name}"?`)) {
      return;
    }
    setWorkspaceMutatingId(view.id);
    try {
      const res = await fetch(`/api/me/workspace/views/${view.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? t("api.internalServerError"));
      }
      setWorkspaceViews((prev) => prev.filter((item) => item.id !== view.id));
      addToast({
        tone: "success",
        title: t("toast.viewDeletedTitle"),
        description: view.name,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : t("api.internalServerError");
      addToast({
        tone: "error",
        title: t("toast.deleteViewErrorTitle"),
        description: message,
      });
    } finally {
      setWorkspaceMutatingId("");
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
    setInfo(t("toast.filtersClearedTitle"));
    addToast({
      tone: "info",
      title: t("toast.filtersClearedTitle"),
    });
  }

  const csvExportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (status) params.set("status", status);
    if (searchQuery) params.set("search", searchQuery);
    if (sort !== "recent") params.set("sort", sort);
    if (mineOnly) params.set("mine", "1");
    return `/api/problems/export${params.toString() ? `?${params.toString()}` : ""}`;
  }, [mineOnly, productId, searchQuery, sort, status]);

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
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-foreground">{t("problems.title")}</h1>
        <Link
          href="/problems/new"
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-opacity shadow-sm"
        >
          {t("problems.newProblem")}
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("problems.matchingProblems")}</p>
          <p className="mt-1 text-2xl font-semibold text-card-foreground">{meta.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("problems.meAffectsCurrentPage")}</p>
          <p className="mt-1 text-2xl font-semibold text-card-foreground">{totalInterests}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{t("problems.myInterestsCurrentPage")}</p>
          <p className="mt-1 text-2xl font-semibold text-card-foreground">
            {problems.filter((item) => item.hasInterest).length}
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-card-foreground">{t("problems.workspace")}</h2>
          {!isAuthenticated && (
            <Link href="/login" className="text-sm text-primary underline hover:no-underline">
              {t("problems.loginToPersist")}
            </Link>
          )}
        </div>
        <form onSubmit={saveCurrentView} className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder={t("problems.workspaceNamePlaceholder")}
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground sm:min-w-[16rem]"
            disabled={!isAuthenticated || workspaceSaving}
          />
          <label className="inline-flex items-center gap-2 text-sm text-secondary-foreground">
            <input
              type="checkbox"
              checked={workspaceFavorite}
              onChange={(e) => setWorkspaceFavorite(e.target.checked)}
              disabled={!isAuthenticated || workspaceSaving}
            />
            {t("problems.favorite")}
          </label>
          <button
            type="submit"
            disabled={!isAuthenticated || workspaceSaving}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-opacity shadow-sm"
          >
            {workspaceSaving ? t("problems.saving") : t("problems.saveCurrentView")}
          </button>
        </form>

        {workspaceLoading ? (
          <p className="text-sm text-muted-foreground">{t("problems.loadingViews")}</p>
        ) : workspaceViews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("problems.noSavedViews")}
          </p>
        ) : (
          <ul className="space-y-2">
            {workspaceViews.map((view) => (
              <li
                key={view.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {view.isFavorite ? "★ " : ""}
                    {view.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      view.productId ? `product:${view.productId}` : t("problems.allProducts"),
                      view.status ? `status:${view.status}` : t("problems.allStatus"),
                      view.search ? `search:${view.search}` : t("problems.noSearch"),
                      `sort:${normalizeViewSort(view.sort)}`,
                      view.mineOnly ? t("problems.mineOnly") : t("problems.allUsers"),
                      `size:${view.pageSize}`,
                    ].join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applySavedView(view)}
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-secondary-foreground bg-secondary hover:bg-muted transition-colors"
                  >
                    {t("problems.apply")}
                  </button>
                  <button
                    type="button"
                    disabled={workspaceMutatingId === view.id}
                    onClick={() => toggleViewFavorite(view)}
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-secondary-foreground bg-secondary hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {view.isFavorite ? t("problems.unfavorite") : t("problems.favorite")}
                  </button>
                  <button
                    type="button"
                    disabled={workspaceMutatingId === view.id}
                    onClick={() => deleteSavedView(view)}
                    className="rounded-md border border-destructive/50 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                  >
                    {t("problems.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
        <label htmlFor="product-filter" className="sr-only">
          {t("problems.filterByProduct")}
        </label>
        <select
          id="product-filter"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
        >
          <option value="">{t("problems.allProductsOption")}</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <label htmlFor="status-filter" className="sr-only">
          {t("problems.filterByStatus")}
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
        >
          <option value="">{t("problems.allStatusOption")}</option>
          <option value="new">{t("status.new")}</option>
          <option value="evaluating">{t("status.evaluating")}</option>
          <option value="planned">{t("status.planned")}</option>
          <option value="in_progress">{t("status.in_progress")}</option>
          <option value="delivered">{t("status.delivered")}</option>
        </select>
        <label htmlFor="search-filter" className="sr-only">
          {t("problems.searchProblems")}
        </label>
        <input
          id="search-filter"
          type="search"
          placeholder={t("problems.searchPlaceholder")}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
        />
        <label htmlFor="sort-filter" className="sr-only">
          {t("problems.sortProblems")}
        </label>
        <select
          id="sort-filter"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as ProblemSort);
            setPage(1);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value === "recent"
                ? t("problems.sortRecent")
                : option.value === "most_interested"
                  ? t("problems.sortInterested")
                  : t("problems.sortCommented")}
            </option>
          ))}
        </select>
        <label htmlFor="mine-filter" className="inline-flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-secondary-foreground sm:w-auto">
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
          {t("problems.onlyMyInterests")}
        </label>
        {!isAuthenticated && (
          <Link
            href="/login"
            className="self-center text-sm text-primary underline hover:no-underline"
          >
            {t("problems.loginToEnable")}
          </Link>
        )}
        <label htmlFor="page-size-filter" className="sr-only">
          {t("problems.itemsPerPage")}
        </label>
        <select
          id="page-size-filter"
          value={pageSize}
          onChange={(e) => {
            setPageSize(parsePageSize(e.target.value));
            setPage(1);
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {t("problems.perPage", { size })}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-muted transition-colors sm:w-auto"
        >
          {t("problems.clearFilters")}
        </button>
        <a
          href={csvExportUrl}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-opacity shadow-sm sm:w-auto"
        >
          {t("problems.exportCsv")}
        </a>
      </div>

      {error && <p className="mb-4 text-destructive">{error}</p>}
      {info && (
        <p className="mb-4 text-primary" aria-live="polite">
          {info}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : problems.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground shadow-sm">
          {t("problems.noProblemsFound")}{" "}
          <Link href="/problems/new" className="font-medium text-primary hover:underline">
            {t("problems.submitOne")}
          </Link>
        </div>
      ) : (
        <div>
          <ul className="space-y-4">
            {problems.map((p) => (
              <li key={p.id}>
                <div className="rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/50">
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                    <Link href={`/problems/${p.id}`} className="min-w-0 flex-1">
                      <h2 className="font-semibold text-card-foreground">{p.title}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
                      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                        p.hasInterest
                          ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                          : "bg-secondary text-secondary-foreground border border-border hover:bg-muted"
                      } disabled:opacity-50 transition-colors`}
                    >
                      {togglingId === p.id
                        ? "..."
                        : p.hasInterest
                          ? t("problems.meAffectsChecked")
                          : t("problems.meAffects")}
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {p._count.interests} {t("problems.peopleMarked")} · {p._count.comments} {t("problems.comments")}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center">
            <p className="text-sm text-muted-foreground">
              {t("problems.showing", { from: fromItem, to: toItem, total: meta.total })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {t("common.previous")}
              </button>
              {paginationTokens.map((token) =>
                typeof token === "number" ? (
                  <button
                    key={token}
                    type="button"
                    onClick={() => setPage(token)}
                    aria-current={token === meta.page ? "page" : undefined}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      token === meta.page
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-secondary-foreground bg-secondary hover:bg-muted"
                    }`}
                  >
                    {token}
                  </button>
                ) : (
                  <span
                    key={token}
                    className="px-1 text-sm text-muted-foreground"
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
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-muted disabled:opacity-50 transition-colors"
              >
                {t("common.next")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

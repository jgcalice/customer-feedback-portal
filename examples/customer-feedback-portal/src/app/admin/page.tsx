"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/i18n/LocaleProvider";

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
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  const { t } = useI18n();

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
          setError(t("api.internalServerError"));
        }
      })
      .finally(() => setLoading(false));
  }, [router, t]);

  async function updateStatus(problemId: string, status: string) {
    setSavingStatusId(problemId);
    setError("");
    setSuccess("");
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
        throw new Error(t("api.internalServerError"));
      }
      const updated = await res.json();
      setProblems((prev) =>
        prev.map((p) => (p.id === problemId ? updated : p))
      );
      setSuccess(t("toast.statusUpdatedDesc"));
      addToast({
        tone: "success",
        title: t("toast.statusUpdatedTitle"),
      });
    } catch {
      setError(t("api.internalServerError"));
      addToast({
        tone: "error",
        title: t("toast.statusUpdateErrorTitle"),
      });
    } finally {
      setSavingStatusId(null);
    }
  }

  const filteredProblems =
    statusFilter === ""
      ? problems
      : problems.filter((p) => p.status === statusFilter);

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
        throw new Error(data.error ?? t("api.internalServerError"));
      }
      const item = await res.json();
      setRoadmap((prev) => [...prev, item]);
      setSuccess(t("toast.roadmapItemCreatedDesc"));
      addToast({
        tone: "success",
        title: t("toast.roadmapItemCreatedTitle"),
      });
      setRoadmapForm({
        productId: products[0]?.id ?? "",
        title: "",
        description: "",
        status: "planned",
        targetMonthOrQuarter: "",
        relatedProblemId: "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("api.internalServerError"));
      addToast({
        tone: "error",
        title: t("toast.roadmapItemErrorTitle"),
        description: e instanceof Error ? e.message : t("api.internalServerError"),
      });
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
      setError(t("api.duplicateProblemIdRequired"));
      return;
    }
    if (targetProblemId === duplicateProblemId) {
      setError(t("api.cannotMergeSelf"));
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
        throw new Error(data.error ?? t("api.internalServerError"));
      }

      setProblems((prev) =>
        prev
          .filter((p) => p.id !== data.mergedProblemId)
          .map((p) => (p.id === data.problem.id ? data.problem : p))
      );
      setSuccess(t("toast.mergeSuccessDesc"));
      addToast({
        tone: "success",
        title: t("toast.mergeSuccessTitle"),
      });
      setMergeForm((prev) => ({
        ...prev,
        duplicateProblemId: "",
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("api.internalServerError"));
      addToast({
        tone: "error",
        title: t("toast.mergeErrorTitle"),
        description: e instanceof Error ? e.message : t("api.internalServerError"),
      });
    } finally {
      setMergeSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12" aria-busy="true">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden
        />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">{t("admin.title")}</h1>
      <p className="mb-8 text-muted-foreground">
        {t("admin.subtitle")}
      </p>

      {error && (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* 1. Atualizar status — principal tarefa do admin */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-foreground">{t("admin.updateProblemStatus")}</h2>
        {problems.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-6 text-muted-foreground shadow-sm">
            {t("admin.noProblemsYet")}
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label htmlFor="admin-status-filter" className="text-sm font-medium text-foreground">
                {t("admin.filterByStatus")}
              </label>
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label={t("admin.filterByStatus")}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">{t("admin.allStatuses")}</option>
                <option value="new">{t("status.new")}</option>
                <option value="evaluating">{t("status.evaluating")}</option>
                <option value="planned">{t("status.planned")}</option>
                <option value="in_progress">{t("status.in_progress")}</option>
                <option value="delivered">{t("status.delivered")}</option>
              </select>
              <span className="text-sm text-muted-foreground">
                {filteredProblems.length === 1
                  ? t("admin.showingCount_one")
                  : t("admin.showingCount_other", { count: filteredProblems.length })}
              </span>
            </div>
            <ul className="space-y-4">
              {filteredProblems.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/problems/${p.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.product.name} · {p._count.interests} {t("problems.meAffects")}
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                      disabled={savingStatusId === p.id}
                      aria-label={`${t("admin.updateProblemStatus")}: ${p.title}`}
                      className="rounded-md border border-input bg-background px-3 py-2 text-foreground disabled:opacity-70"
                    >
                      <option value="new">{t("status.new")}</option>
                      <option value="evaluating">{t("status.evaluating")}</option>
                      <option value="planned">{t("status.planned")}</option>
                      <option value="in_progress">{t("status.in_progress")}</option>
                      <option value="delivered">{t("status.delivered")}</option>
                    </select>
                    {savingStatusId === p.id && (
                      <span className="text-xs text-muted-foreground" aria-live="polite">
                        {t("admin.savingStatus")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* 2. Adicionar item de roadmap */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("admin.addRoadmapItem")}</h2>
        <form
          onSubmit={addRoadmapItem}
          className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex sm:flex-wrap sm:gap-4"
        >
          <select
            value={roadmapForm.productId}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, productId: e.target.value })
            }
            required
            aria-label="Roadmap product"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
          >
            <option value="">{t("admin.product")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder={t("admin.titleLabel")}
            value={roadmapForm.title}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, title: e.target.value })
            }
            required
            aria-label="Roadmap title"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
          />
          <input
            type="text"
            placeholder={t("admin.descriptionOptional")}
            value={roadmapForm.description}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, description: e.target.value })
            }
            aria-label="Roadmap description"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
          />
          <input
            type="text"
            placeholder={t("admin.targetPlaceholder")}
            value={roadmapForm.targetMonthOrQuarter}
            onChange={(e) =>
              setRoadmapForm({
                ...roadmapForm,
                targetMonthOrQuarter: e.target.value,
              })
            }
            aria-label="Roadmap target"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
          />
          <select
            value={roadmapForm.status}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, status: e.target.value })
            }
            aria-label="Roadmap status"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
          >
            <option value="planned">{t("status.planned")}</option>
            <option value="in_progress">{t("status.in_progress")}</option>
            <option value="delivered">{t("status.delivered")}</option>
          </select>
          <select
            value={roadmapForm.relatedProblemId}
            onChange={(e) =>
              setRoadmapForm({ ...roadmapForm, relatedProblemId: e.target.value })
            }
            aria-label="Related problem"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground sm:w-auto"
          >
            <option value="">{t("admin.noRelatedProblem")}</option>
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-opacity shadow-sm"
          >
            {t("admin.add")}
          </button>
        </form>
      </section>

      {/* 3. Mesclar duplicados */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("admin.mergeDuplicates")}</h2>
        {problems.length < 2 ? (
          <p className="text-muted-foreground">
            {t("admin.needAtLeastTwo")}
          </p>
        ) : (
          <form
            onSubmit={mergeDuplicateProblems}
            className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:grid-cols-2 sm:items-end"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="merge-target" className="text-sm font-medium text-foreground">
                {t("admin.targetProblemKeep")}
              </label>
              <select
                id="merge-target"
                value={mergeForm.targetProblemId}
                onChange={(e) =>
                  setMergeForm({ ...mergeForm, targetProblemId: e.target.value })
                }
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              >
                <option value="">—</option>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="merge-duplicate" className="text-sm font-medium text-foreground">
                {t("admin.duplicateProblemRemove")}
              </label>
              <select
                id="merge-duplicate"
                value={mergeForm.duplicateProblemId}
                onChange={(e) =>
                  setMergeForm({
                    ...mergeForm,
                    duplicateProblemId: e.target.value,
                  })
                }
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              >
                <option value="">—</option>
                {problems.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={mergeSubmitting}
              className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-opacity shadow-sm sm:col-span-2 sm:w-fit"
            >
              {mergeSubmitting ? t("admin.merging") : t("admin.merge")}
            </button>
          </form>
        )}
      </section>

      {/* 4. Lista de itens de roadmap */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t("admin.roadmapItems")}</h2>
        {roadmap.length === 0 ? (
          <p className="text-muted-foreground">{t("admin.noRoadmapItemsYet")}</p>
        ) : (
          <ul className="space-y-2">
            {roadmap.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {r.title} <span className="text-muted-foreground">({r.product.name})</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.targetMonthOrQuarter && (
                      <span className="text-xs text-muted-foreground">
                        {r.targetMonthOrQuarter}
                      </span>
                    )}
                  </div>
                </div>
                {r.problemRoadmap && r.problemRoadmap.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("common.related")}{" "}
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

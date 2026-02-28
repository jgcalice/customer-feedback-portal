"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/i18n/LocaleProvider";

type Problem = {
  id: string;
  title: string;
  problemStatement: string;
  impact: string;
  frequency: string;
  workaround: string | null;
  status: string;
  product: { name: string };
  createdBy: { name: string | null; email: string };
  _count: { interests: number };
  hasInterest: boolean;
  comments: {
    id: string;
    text: string;
    createdAt: string;
    user: { id: string; name: string | null; email: string };
  }[];
};

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [toggling, setToggling] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const { addToast } = useToast();
  const { locale, t } = useI18n();

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(t("problemDetail.notFound"));
        return r.json();
      })
      .then(setProblem)
      .catch(() => setLoadError(t("problemDetail.problemNotFound")))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      addToast({
        tone: "success",
        title: t("toast.createdProblemTitle"),
        description: t("toast.createdProblemDesc"),
      });
      router.replace(`/problems/${id}`, { scroll: false });
    }
  }, [addToast, id, router, searchParams]);

  async function toggleInterest() {
    if (!problem) return;
    setError("");
    setInfo("");
    setToggling(true);
    try {
      const method = problem.hasInterest ? "DELETE" : "POST";
      const res = await fetch(`/api/problems/${id}/interest`, { method });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setError(data.error ?? t("api.internalServerError"));
        return;
      }
      setProblem({
        ...problem,
        hasInterest: !problem.hasInterest,
        _count: {
          interests: data._count?.interests ?? problem._count.interests + (problem.hasInterest ? -1 : 1),
        },
      });
      setInfo(!problem.hasInterest ? t("toast.interestAddedDesc") : t("toast.interestRemovedDesc"));
      addToast({
        tone: "success",
        title: !problem.hasInterest ? t("toast.interestAddedTitle") : t("toast.interestRemovedTitle"),
      });
      router.refresh();
    } catch {
      const message = t("login.genericError");
      setError(message);
      addToast({ tone: "error", title: t("toast.interestUpdateErrorTitle"), description: message });
    } finally {
      setToggling(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!problem) return;
    const text = commentText.trim();
    if (text.length < 3) {
      const msg = t("problemDetail.minCommentError");
      setError(msg);
      addToast({ tone: "error", title: t("toast.commentErrorTitle"), description: msg });
      return;
    }

    setError("");
    setInfo("");
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/problems/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(data.error ?? t("api.internalServerError"));
      }

      setProblem({
        ...problem,
        comments: [data, ...problem.comments],
      });
      setCommentText("");
      setInfo(t("toast.commentPostedTitle"));
      addToast({
        tone: "success",
        title: t("toast.commentPostedTitle"),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : t("login.genericError");
      setError(message);
      addToast({ tone: "error", title: t("toast.commentErrorTitle"), description: message });
    } finally {
      setCommentLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12" aria-busy="true">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden
        />
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }
  if (loadError || !problem) {
    return (
      <div>
        <p className="text-destructive">{loadError ?? t("problemDetail.notFound")}</p>
        <Link href="/problems" className="mt-4 inline-block text-primary hover:underline">
          {t("problemDetail.backToProblems")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/problems" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← {t("problemDetail.backToProblems")}
      </Link>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">{problem.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{problem.product.name}</span>
              <StatusBadge status={problem.status} />
            </div>
          </div>
          <button
            onClick={toggleInterest}
            disabled={toggling}
            className={`rounded-md px-4 py-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              problem.hasInterest
                ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                : "bg-secondary text-secondary-foreground border border-border hover:bg-muted"
            } disabled:opacity-50 transition-colors`}
          >
            {problem.hasInterest ? t("problems.meAffectsChecked") : t("problems.meAffects")} ({problem._count.interests})
          </button>
        </div>
        {error && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}
        {info && (
          <p className="mb-3 text-sm text-primary" aria-live="polite">
            {info}
          </p>
        )}
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("problemDetail.problem")}</dt>
            <dd className="mt-1 text-foreground">{problem.problemStatement}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("problemDetail.impact")}</dt>
            <dd className="mt-1 text-foreground">{problem.impact}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("problemDetail.frequency")}</dt>
            <dd className="mt-1 text-foreground">{problem.frequency}</dd>
          </div>
          {problem.workaround && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">{t("problemDetail.workaround")}</dt>
              <dd className="mt-1 text-foreground">{problem.workaround}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-muted-foreground">{t("problemDetail.submittedBy")}</dt>
            <dd className="mt-1 text-foreground">
              {problem.createdBy.name ?? problem.createdBy.email}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold text-card-foreground">{t("problemDetail.commentsTitle")}</h2>
        <form onSubmit={submitComment} className="mb-4 space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder={t("problemDetail.commentsPlaceholder")}
            aria-label="Comment text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
          />
          <button
            type="submit"
            disabled={commentLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-opacity shadow-sm"
          >
            {commentLoading ? t("problemDetail.posting") : t("problemDetail.postComment")}
          </button>
        </form>
        {problem.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("problemDetail.noCommentsYet")}</p>
        ) : (
          <ul className="space-y-3">
            {problem.comments.map((comment) => (
              <li key={comment.id} className="rounded-md border border-border bg-muted p-3">
                <p className="text-sm text-foreground">{comment.text}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {comment.user.name ?? comment.user.email} ·{" "}
                  {new Date(comment.createdAt).toLocaleString(locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

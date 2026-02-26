"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

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
  const id = params.id as string;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [toggling, setToggling] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setProblem)
      .catch(() => setLoadError("Problem not found"))
      .finally(() => setLoading(false));
  }, [id]);

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
        setError(data.error ?? "Failed");
        return;
      }
      setProblem({
        ...problem,
        hasInterest: !problem.hasInterest,
        _count: {
          interests: data._count?.interests ?? problem._count.interests + (problem.hasInterest ? -1 : 1),
        },
      });
      setInfo(!problem.hasInterest ? "Marcado como 'me afeta'." : "Marcacao removida.");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setToggling(false);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!problem) return;
    const text = commentText.trim();
    if (text.length < 3) {
      setError("Comment must have at least 3 characters");
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
        throw new Error(data.error ?? "Failed to comment");
      }

      setProblem({
        ...problem,
        comments: [data, ...problem.comments],
      });
      setCommentText("");
      setInfo("Comment posted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setCommentLoading(false);
    }
  }

  if (loading) return <p className="text-zinc-600">Loading...</p>;
  if (loadError || !problem) {
    return (
      <div>
        <p className="text-red-600">{loadError ?? "Not found"}</p>
        <Link href="/problems" className="mt-4 inline-block hover:underline">
          Back to problems
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/problems" className="mb-4 inline-block text-sm hover:underline">
        ← Back to problems
      </Link>
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{problem.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
              <span>{problem.product.name}</span>
              <StatusBadge status={problem.status} />
            </div>
          </div>
          <button
            onClick={toggleInterest}
            disabled={toggling}
            className={`rounded px-4 py-2 font-medium ${
              problem.hasInterest
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            } disabled:opacity-50`}
          >
            {problem.hasInterest ? "✓ Me afeta" : "Me afeta"} ({problem._count.interests})
          </button>
        </div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {info && <p className="mb-3 text-sm text-emerald-700">{info}</p>}
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-zinc-500">Problem</dt>
            <dd className="mt-1">{problem.problemStatement}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Impact</dt>
            <dd className="mt-1">{problem.impact}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Frequency</dt>
            <dd className="mt-1">{problem.frequency}</dd>
          </div>
          {problem.workaround && (
            <div>
              <dt className="text-sm font-medium text-zinc-500">Workaround</dt>
              <dd className="mt-1">{problem.workaround}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-zinc-500">Submitted by</dt>
            <dd className="mt-1">
              {problem.createdBy.name ?? problem.createdBy.email}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold">Comments</h2>
        <form onSubmit={submitComment} className="mb-4 space-y-3">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder="Add context, examples, or details..."
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={commentLoading}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {commentLoading ? "Posting..." : "Post comment"}
          </button>
        </form>
        {problem.comments.length === 0 ? (
          <p className="text-sm text-zinc-600">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {problem.comments.map((comment) => (
              <li key={comment.id} className="rounded border bg-zinc-50 p-3">
                <p className="text-sm">{comment.text}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {comment.user.name ?? comment.user.email} ·{" "}
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

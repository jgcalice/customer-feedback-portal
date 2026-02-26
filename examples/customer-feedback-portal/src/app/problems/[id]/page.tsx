"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
};

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setProblem)
      .catch(() => setError("Problem not found"))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleInterest() {
    if (!problem) return;
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
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setToggling(false);
    }
  }

  if (loading) return <p className="text-zinc-600">Loading...</p>;
  if (error || !problem) {
    return (
      <div>
        <p className="text-red-600">{error ?? "Not found"}</p>
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
            <p className="text-sm text-zinc-600">
              {problem.product.name} · {problem.status}
            </p>
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
    </div>
  );
}

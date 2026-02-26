import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Home() {
  const [problemCount, roadmapCount, interestCount, recentProblems] = await Promise.all([
    prisma.problem.count(),
    prisma.roadmapItem.count(),
    prisma.interest.count(),
    prisma.problem.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        product: true,
        _count: { select: { interests: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-gradient-to-r from-zinc-900 to-zinc-700 p-6 text-white">
        <h1 className="text-3xl font-bold">Customer Feedback Portal</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-100">
          Centralize product problems, validate impact with customer interest, and
          keep roadmap communication transparent.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/problems/new"
            className="rounded bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Submit a problem
          </Link>
          <Link
            href="/roadmap"
            className="rounded border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            View roadmap
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Problems</p>
          <p className="mt-1 text-3xl font-semibold">{problemCount}</p>
        </article>
        <article className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Roadmap items</p>
          <p className="mt-1 text-3xl font-semibold">{roadmapCount}</p>
        </article>
        <article className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Interest marks</p>
          <p className="mt-1 text-3xl font-semibold">{interestCount}</p>
        </article>
      </section>

      <section className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent problems</h2>
          <Link href="/problems" className="text-sm font-medium hover:underline">
            See all
          </Link>
        </div>
        {recentProblems.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No problems yet. Create the first one from the button above.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentProblems.map((problem) => (
              <li key={problem.id} className="rounded border bg-zinc-50 p-3">
                <Link href={`/problems/${problem.id}`} className="font-medium hover:underline">
                  {problem.title}
                </Link>
                <p className="mt-1 text-sm text-zinc-600">
                  {problem.product.name} · {problem._count.interests} me afeta
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { getI18nServer } from "@/i18n/server";

export default async function Home() {
  const { t } = await getI18nServer();
  const [problemCount, roadmapCount, interestCount, recentProblems, statusGroups] = await Promise.all([
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
    prisma.problem.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);
  const statusCounts = Object.fromEntries(
    statusGroups.map((group) => [group.status, group._count._all])
  );

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border bg-primary p-4 text-primary-foreground shadow-lg sm:p-6">
        <h1 className="text-3xl font-bold">{t("home.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm opacity-90">
          {t("home.subtitle")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/problems/new"
            className="rounded-md bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary hover:opacity-90 transition-opacity shadow-sm"
          >
            {t("home.submitProblem")}
          </Link>
          <Link
            href="/roadmap"
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-white/10 transition-colors"
          >
            {t("home.viewRoadmap")}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("home.problems")}</p>
          <p className="mt-1 text-3xl font-semibold text-card-foreground">{problemCount}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("home.roadmapItems")}</p>
          <p className="mt-1 text-3xl font-semibold text-card-foreground">{roadmapCount}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("home.interestMarks")}</p>
          <p className="mt-1 text-3xl font-semibold text-card-foreground">{interestCount}</p>
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold text-card-foreground">{t("home.quickFilters")}</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { status: "new", label: t("status.new") },
            { status: "evaluating", label: t("status.evaluating") },
            { status: "planned", label: t("status.planned") },
            { status: "in_progress", label: t("status.in_progress") },
            { status: "delivered", label: t("status.delivered") },
          ].map((item) => (
            <Link
              key={item.status}
              href={`/problems?status=${item.status}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-secondary-foreground bg-secondary hover:bg-muted transition-colors"
            >
              {item.label} ({statusCounts[item.status] ?? 0})
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-card-foreground">{t("home.recentProblems")}</h2>
          <Link href="/problems" className="text-sm font-medium text-primary hover:underline">
            {t("home.seeAll")}
          </Link>
        </div>
        {recentProblems.length === 0 ? (
          <EmptyState
            message={t("home.noProblemsYet")}
            actionLabel={t("home.createFirstOne")}
            actionHref="/problems/new"
          />
        ) : (
          <ul className="space-y-3">
            {recentProblems.map((problem) => (
              <li key={problem.id} className="rounded-md border border-border bg-muted p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/problems/${problem.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                    {problem.title}
                  </Link>
                  <StatusBadge status={problem.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {problem.product.name} · {problem._count.interests} {t("home.meAffectsSuffix")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth, getSession } from "@/lib/auth";

type ProblemSort = "recent" | "most_interested" | "most_commented";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function parseSort(value: string | null): ProblemSort {
  if (value === "most_interested" || value === "most_commented") {
    return value;
  }
  return "recent";
}

function buildOrderBy(sort: ProblemSort): Prisma.ProblemOrderByWithRelationInput[] {
  if (sort === "most_interested") {
    return [{ interests: { _count: "desc" } }, { createdAt: "desc" }];
  }
  if (sort === "most_commented") {
    return [{ comments: { _count: "desc" } }, { createdAt: "desc" }];
  }
  return [{ createdAt: "desc" }];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sort = parseSort(searchParams.get("sort"));
    const paginated =
      searchParams.get("paginated") === "1" ||
      searchParams.get("paginated") === "true";
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = Math.min(parsePositiveInt(searchParams.get("pageSize"), 6), 50);

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { problemStatement: { contains: search } },
      ];
    }

    const orderBy = buildOrderBy(sort);
    let total = 0;
    let safePage = page;

    if (paginated) {
      total = await prisma.problem.count({ where });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      safePage = Math.min(page, totalPages);
    }

    const problems = await prisma.problem.findMany({
      where,
      include: {
        product: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { interests: true, comments: true } },
      },
      orderBy,
      ...(paginated
        ? {
            skip: (safePage - 1) * pageSize,
            take: pageSize,
          }
        : {}),
    });

    const session = await getSession();
    let interestMap: Record<string, boolean> = {};
    if (session) {
      const interests = await prisma.interest.findMany({
        where: {
          userId: session.userId,
          problemId: { in: problems.map((p) => p.id) },
        },
        select: { problemId: true },
      });
      interestMap = Object.fromEntries(
        interests.map((i) => [i.problemId, true])
      );
    }

    const result = problems.map((p) => ({
      ...p,
      hasInterest: !!interestMap[p.id],
    }));

    if (paginated) {
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      return NextResponse.json({
        items: result,
        meta: {
          page: safePage,
          pageSize,
          total,
          totalPages,
          sort,
        },
      });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { productId, title, problemStatement, impact, frequency, workaround } =
      body;

    if (!productId || !title || !problemStatement || !impact || !frequency) {
      return NextResponse.json(
        { error: "productId, title, problemStatement, impact, frequency required" },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.create({
      data: {
        productId,
        title,
        problemStatement,
        impact,
        frequency: String(frequency),
        workaround: workaround ?? "",
        createdById: session.userId,
      },
      include: {
        product: true,
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(problem);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

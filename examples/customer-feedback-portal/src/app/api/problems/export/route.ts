import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

type ProblemSort = "recent" | "most_interested" | "most_commented";

function parseSort(value: string | null): ProblemSort {
  if (value === "most_interested" || value === "most_commented") {
    return value;
  }
  return "recent";
}

function parseBoolean(value: string | null) {
  return value === "1" || value === "true" || value === "yes";
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

function toCsvCell(value: unknown) {
  const raw = String(value ?? "");
  return `"${raw.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sort = parseSort(searchParams.get("sort"));
    const mineOnly = parseBoolean(searchParams.get("mine"));
    const session = await getSession();

    if (mineOnly && !session) {
      return NextResponse.json(
        { error: "Login required to export your interests" },
        { status: 401 }
      );
    }

    const where: Prisma.ProblemWhereInput = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { problemStatement: { contains: search } },
      ];
    }
    if (mineOnly && session) {
      where.interests = {
        some: { userId: session.userId },
      };
    }

    const rows = await prisma.problem.findMany({
      where,
      include: {
        product: true,
        createdBy: { select: { email: true, name: true } },
        _count: { select: { interests: true, comments: true } },
      },
      orderBy: buildOrderBy(sort),
    });

    const header = [
      "id",
      "title",
      "status",
      "product",
      "impact",
      "frequency",
      "interests_count",
      "comments_count",
      "created_by",
      "created_at",
      "updated_at",
    ];
    const csvRows = rows.map((row) =>
      [
        row.id,
        row.title,
        row.status,
        row.product.name,
        row.impact,
        row.frequency,
        row._count.interests,
        row._count.comments,
        row.createdBy.name ?? row.createdBy.email,
        row.createdAt.toISOString(),
        row.updatedAt.toISOString(),
      ]
        .map(toCsvCell)
        .join(",")
    );

    const csvContent = [header.join(","), ...csvRows].join("\n");
    const dateSuffix = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="problems-export-${dateSuffix}.csv"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

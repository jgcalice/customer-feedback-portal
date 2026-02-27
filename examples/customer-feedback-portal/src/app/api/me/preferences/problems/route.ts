import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type ProblemSort = "recent" | "most_interested" | "most_commented";

const ALLOWED_PAGE_SIZES = [6, 12, 24] as const;

function parseSort(value: unknown): ProblemSort {
  if (value === "most_interested" || value === "most_commented") {
    return value;
  }
  return "recent";
}

function parsePageSize(value: unknown): (typeof ALLOWED_PAGE_SIZES)[number] {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (ALLOWED_PAGE_SIZES.includes(parsed as never)) {
    return parsed as (typeof ALLOWED_PAGE_SIZES)[number];
  }
  return 6;
}

function normalizeNullableString(value: unknown) {
  const parsed = String(value ?? "").trim();
  return parsed ? parsed : null;
}

function normalizeBoolean(value: unknown) {
  return value === true || value === "true" || value === "1";
}

export async function GET() {
  try {
    const session = await requireAuth();
    const preference = await prisma.userPreference.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      preferences: {
        productId: preference?.problemsProductId ?? "",
        status: preference?.problemsStatus ?? "",
        search: preference?.problemsSearch ?? "",
        sort: parseSort(preference?.problemsSort),
        mineOnly: preference?.problemsMineOnly ?? false,
        pageSize: parsePageSize(preference?.problemsPageSize),
      },
    });
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

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const saved = await prisma.userPreference.upsert({
      where: { userId: session.userId },
      update: {
        problemsProductId: normalizeNullableString(body.productId),
        problemsStatus: normalizeNullableString(body.status),
        problemsSearch: normalizeNullableString(body.search),
        problemsSort: parseSort(body.sort),
        problemsMineOnly: normalizeBoolean(body.mineOnly),
        problemsPageSize: parsePageSize(body.pageSize),
      },
      create: {
        userId: session.userId,
        problemsProductId: normalizeNullableString(body.productId),
        problemsStatus: normalizeNullableString(body.status),
        problemsSearch: normalizeNullableString(body.search),
        problemsSort: parseSort(body.sort),
        problemsMineOnly: normalizeBoolean(body.mineOnly),
        problemsPageSize: parsePageSize(body.pageSize),
      },
    });

    return NextResponse.json({
      preferences: {
        productId: saved.problemsProductId ?? "",
        status: saved.problemsStatus ?? "",
        search: saved.problemsSearch ?? "",
        sort: parseSort(saved.problemsSort),
        mineOnly: saved.problemsMineOnly,
        pageSize: parsePageSize(saved.problemsPageSize),
      },
    });
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

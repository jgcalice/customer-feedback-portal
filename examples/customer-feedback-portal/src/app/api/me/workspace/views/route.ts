import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getI18nServer } from "@/i18n/server";

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

function normalizeName(value: unknown) {
  const parsed = String(value ?? "").trim();
  return parsed.slice(0, 80);
}

export async function GET() {
  try {
    const session = await requireAuth();
    const views = await prisma.savedProblemView.findMany({
      where: { userId: session.userId },
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ views });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: (await getI18nServer()).t("api.unauthorized") }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { error: (await getI18nServer()).t("api.internalServerError") },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { t } = await getI18nServer();
    const session = await requireAuth();
    const body = await request.json();
    const name = normalizeName(body.name);

    if (!name) {
      return NextResponse.json({ error: t("api.nameRequired") }, { status: 400 });
    }

    const view = await prisma.savedProblemView.create({
      data: {
        userId: session.userId,
        name,
        productId: normalizeNullableString(body.productId),
        status: normalizeNullableString(body.status),
        search: normalizeNullableString(body.search),
        sort: parseSort(body.sort),
        mineOnly: normalizeBoolean(body.mineOnly),
        pageSize: parsePageSize(body.pageSize),
        isFavorite: normalizeBoolean(body.isFavorite),
      },
    });

    return NextResponse.json(view);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: (await getI18nServer()).t("api.unauthorized") }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { error: (await getI18nServer()).t("api.internalServerError") },
      { status: 500 }
    );
  }
}

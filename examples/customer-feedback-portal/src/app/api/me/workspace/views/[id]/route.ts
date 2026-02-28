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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { t } = await getI18nServer();
    const session = await requireAuth();
    const { id } = await params;

    const existing = await prisma.savedProblemView.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: t("api.notFound") }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = normalizeName(body.name);
      if (!name) {
        return NextResponse.json({ error: t("api.nameCannotBeEmpty") }, { status: 400 });
      }
      data.name = name;
    }
    if (body.productId !== undefined) {
      data.productId = normalizeNullableString(body.productId);
    }
    if (body.status !== undefined) {
      data.status = normalizeNullableString(body.status);
    }
    if (body.search !== undefined) {
      data.search = normalizeNullableString(body.search);
    }
    if (body.sort !== undefined) {
      data.sort = parseSort(body.sort);
    }
    if (body.mineOnly !== undefined) {
      data.mineOnly = normalizeBoolean(body.mineOnly);
    }
    if (body.pageSize !== undefined) {
      data.pageSize = parsePageSize(body.pageSize);
    }
    if (body.isFavorite !== undefined) {
      data.isFavorite = normalizeBoolean(body.isFavorite);
    }

    const updated = await prisma.savedProblemView.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { t } = await getI18nServer();
    const session = await requireAuth();
    const { id } = await params;

    const result = await prisma.savedProblemView.deleteMany({
      where: { id, userId: session.userId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: t("api.notFound") }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
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

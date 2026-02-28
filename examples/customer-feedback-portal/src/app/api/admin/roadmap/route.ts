import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireInternal } from "@/lib/auth";
import { getI18nServer } from "@/i18n/server";

export async function POST(request: NextRequest) {
  const { t } = await getI18nServer();
  try {
    await requireInternal();
    const body = await request.json();
    const {
      productId,
      title,
      description,
      status,
      targetMonthOrQuarter,
      problemIds,
    } = body;

    if (!productId || !title) {
      return NextResponse.json(
        { error: t("api.productAndTitleRequired") },
        { status: 400 }
      );
    }

    const relatedProblemIds = Array.isArray(problemIds)
      ? problemIds.map((id) => String(id)).filter(Boolean)
      : [];

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.roadmapItem.create({
        data: {
          productId,
          title,
          description: description ?? "",
          status: status ?? "planned",
          targetMonthOrQuarter: targetMonthOrQuarter ?? "",
          problemRoadmap: {
            create: relatedProblemIds.map((problemId) => ({
              problemId,
            })),
          },
        },
        include: {
          product: true,
          problemRoadmap: {
            include: {
              problem: {
                select: { id: true, title: true },
              },
            },
          },
        },
      });

      return created;
    });

    return NextResponse.json(item);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: t("api.unauthorized") }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: t("api.forbidden") }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json(
      { error: t("api.internalServerError") },
      { status: 500 }
    );
  }
}

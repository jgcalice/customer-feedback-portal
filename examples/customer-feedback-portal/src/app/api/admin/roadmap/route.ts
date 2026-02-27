import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireInternal } from "@/lib/auth";

export async function POST(request: NextRequest) {
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
        { error: "productId and title required" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

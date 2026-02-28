import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireInternal } from "@/lib/auth";
import { getI18nServer } from "@/i18n/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { t } = await getI18nServer();
  try {
    await requireInternal();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: t("api.statusRequired") },
        { status: 400 }
      );
    }

    const valid = ["new", "evaluating", "planned", "in_progress", "delivered"];
    if (!valid.includes(status)) {
      return NextResponse.json(
        { error: t("api.invalidStatus") },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.update({
      where: { id },
      data: { status },
      include: {
        product: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { interests: true } },
      },
    });

    return NextResponse.json(problem);
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

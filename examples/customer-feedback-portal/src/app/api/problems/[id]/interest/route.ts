import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getI18nServer } from "@/i18n/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { t } = await getI18nServer();
  try {
    const session = await requireAuth();
    const { id } = await params;

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem) {
      return NextResponse.json({ error: t("api.notFound") }, { status: 404 });
    }

    await prisma.interest.upsert({
      where: {
        problemId_userId: { problemId: id, userId: session.userId },
      },
      create: { problemId: id, userId: session.userId },
      update: {},
    });

    const updated = await prisma.problem.findUnique({
      where: { id },
      include: { _count: { select: { interests: true } } },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: t("api.unauthorized") }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { error: t("api.internalServerError") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { t } = await getI18nServer();
  try {
    const session = await requireAuth();
    const { id } = await params;

    await prisma.interest.deleteMany({
      where: { problemId: id, userId: session.userId },
    });

    const updated = await prisma.problem.findUnique({
      where: { id },
      include: { _count: { select: { interests: true } } },
    });
    return NextResponse.json(updated ?? { id, _count: { interests: 0 } });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: t("api.unauthorized") }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json(
      { error: t("api.internalServerError") },
      { status: 500 }
    );
  }
}

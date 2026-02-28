import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getI18nServer } from "@/i18n/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { t } = await getI18nServer();
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const text = String(body.text ?? "").trim();

    if (text.length < 3) {
      return NextResponse.json(
        { error: t("api.commentMinLength") },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem) {
      return NextResponse.json({ error: t("api.problemNotFound") }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        problemId: id,
        userId: session.userId,
        text,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
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

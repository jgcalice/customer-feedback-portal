import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getI18nServer } from "@/i18n/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { t } = await getI18nServer();
    const { id } = await params;
    const session = await getSession();

    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        product: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { interests: true } },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: t("api.notFound") }, { status: 404 });
    }

    let hasInterest = false;
    if (session) {
      const interest = await prisma.interest.findUnique({
        where: {
          problemId_userId: { problemId: id, userId: session.userId },
        },
      });
      hasInterest = !!interest;
    }

    return NextResponse.json({ ...problem, hasInterest });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: (await getI18nServer()).t("api.internalServerError") },
      { status: 500 }
    );
  }
}

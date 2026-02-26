import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { problemStatement: { contains: search } },
      ];
    }

    const problems = await prisma.problem.findMany({
      where,
      include: {
        product: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { interests: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const session = await getSession();
    let interestMap: Record<string, boolean> = {};
    if (session) {
      const interests = await prisma.interest.findMany({
        where: {
          userId: session.userId,
          problemId: { in: problems.map((p) => p.id) },
        },
        select: { problemId: true },
      });
      interestMap = Object.fromEntries(
        interests.map((i) => [i.problemId, true])
      );
    }

    const result = problems.map((p) => ({
      ...p,
      hasInterest: !!interestMap[p.id],
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { productId, title, problemStatement, impact, frequency, workaround } =
      body;

    if (!productId || !title || !problemStatement || !impact || !frequency) {
      return NextResponse.json(
        { error: "productId, title, problemStatement, impact, frequency required" },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.create({
      data: {
        productId,
        title,
        problemStatement,
        impact,
        frequency: String(frequency),
        workaround: workaround ?? "",
        createdById: session.userId,
      },
      include: {
        product: true,
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(problem);
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

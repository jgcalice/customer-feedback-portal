import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireInternal } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInternal();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "status required" },
        { status: 400 }
      );
    }

    const valid = ["new", "evaluating", "planned", "in_progress", "delivered"];
    if (!valid.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
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

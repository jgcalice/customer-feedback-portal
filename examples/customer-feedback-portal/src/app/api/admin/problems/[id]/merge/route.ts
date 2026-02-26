import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireInternal } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInternal();
    const { id: targetProblemId } = await params;
    const body = await request.json();
    const duplicateProblemId = String(body.duplicateProblemId ?? "");

    if (!duplicateProblemId) {
      return NextResponse.json(
        { error: "duplicateProblemId required" },
        { status: 400 }
      );
    }
    if (duplicateProblemId === targetProblemId) {
      return NextResponse.json(
        { error: "Cannot merge a problem into itself" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const [target, duplicate] = await Promise.all([
        tx.problem.findUnique({ where: { id: targetProblemId } }),
        tx.problem.findUnique({ where: { id: duplicateProblemId } }),
      ]);

      if (!target) {
        throw new Error("TARGET_NOT_FOUND");
      }
      if (!duplicate) {
        throw new Error("DUPLICATE_NOT_FOUND");
      }

      const duplicateInterests = await tx.interest.findMany({
        where: { problemId: duplicateProblemId },
        select: { userId: true },
      });
      for (const item of duplicateInterests) {
        await tx.interest.upsert({
          where: {
            problemId_userId: {
              problemId: targetProblemId,
              userId: item.userId,
            },
          },
          create: {
            problemId: targetProblemId,
            userId: item.userId,
          },
          update: {},
        });
      }

      const roadmapLinks = await tx.problemRoadmap.findMany({
        where: { problemId: duplicateProblemId },
        select: { roadmapItemId: true },
      });
      for (const item of roadmapLinks) {
        await tx.problemRoadmap.upsert({
          where: {
            problemId_roadmapItemId: {
              problemId: targetProblemId,
              roadmapItemId: item.roadmapItemId,
            },
          },
          create: {
            problemId: targetProblemId,
            roadmapItemId: item.roadmapItemId,
          },
          update: {},
        });
      }

      if (
        duplicate.problemStatement &&
        !target.problemStatement.includes(duplicate.problemStatement)
      ) {
        await tx.problem.update({
          where: { id: targetProblemId },
          data: {
            problemStatement:
              `${target.problemStatement}\n\n----\n` +
              `Merged duplicate (${duplicate.id}):\n${duplicate.problemStatement}`,
          },
        });
      }

      await tx.problem.delete({
        where: { id: duplicateProblemId },
      });

      return tx.problem.findUnique({
        where: { id: targetProblemId },
        include: {
          product: true,
          createdBy: { select: { name: true, email: true } },
          _count: { select: { interests: true } },
        },
      });
    });

    return NextResponse.json({
      ok: true,
      mergedProblemId: duplicateProblemId,
      problem: result,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "TARGET_NOT_FOUND") {
      return NextResponse.json({ error: "Target problem not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "DUPLICATE_NOT_FOUND") {
      return NextResponse.json({ error: "Duplicate problem not found" }, { status: 404 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

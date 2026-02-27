import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.roadmapItem.findMany({
    include: {
      product: true,
      problemRoadmap: {
        include: { problem: true },
      },
    },
    orderBy: [{ productId: "asc" }, { createdAt: "asc" }],
  });

  const byProduct = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.product.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return NextResponse.json(byProduct);
}

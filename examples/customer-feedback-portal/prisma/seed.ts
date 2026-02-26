import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const productNames = ["WMS", "Roteirização", "ERP"];
  const products: { id: string; name: string }[] = [];
  for (const name of productNames) {
    const existing = await prisma.product.findFirst({ where: { name } });
    if (existing) {
      products.push(existing);
    } else {
      products.push(await prisma.product.create({ data: { name } }));
    }
  }

  const internalUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      role: "internal",
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Customer",
      role: "customer",
    },
  });

  const wmsProduct = products.find((item) => item.name === "WMS") ?? products[0];
  const erpProduct = products.find((item) => item.name === "ERP") ?? products[0];
  if (!wmsProduct || !erpProduct) {
    throw new Error("Expected WMS and ERP products to exist after seed");
  }

  const separationProblem =
    (await prisma.problem.findFirst({
      where: { title: "Separacao muito lenta em horarios de pico" },
    })) ??
    (await prisma.problem.create({
      data: {
        productId: wmsProduct.id,
        createdById: customerUser.id,
        title: "Separacao muito lenta em horarios de pico",
        problemStatement:
          "Nos periodos de maior movimento, a tela de separacao leva varios segundos para responder.",
        impact: "Perda de produtividade e atrasos no despacho",
        frequency: "daily",
        workaround: "Dividir lotes manualmente",
        status: "evaluating",
      },
    }));

  const inventoryProblem =
    (await prisma.problem.findFirst({
      where: { title: "Divergencia de estoque no fechamento diario" },
    })) ??
    (await prisma.problem.create({
      data: {
        productId: erpProduct.id,
        createdById: customerUser.id,
        title: "Divergencia de estoque no fechamento diario",
        problemStatement:
          "Relatorio de fechamento mostra diferencas entre saldo fisico e sistema em alguns SKUs.",
        impact: "Confiabilidade baixa no inventario e retrabalho da equipe",
        frequency: "weekly",
        workaround: "Conferencia manual em planilha",
        status: "planned",
      },
    }));

  await prisma.interest.upsert({
    where: {
      problemId_userId: {
        problemId: separationProblem.id,
        userId: customerUser.id,
      },
    },
    update: {},
    create: {
      problemId: separationProblem.id,
      userId: customerUser.id,
    },
  });
  await prisma.interest.upsert({
    where: {
      problemId_userId: {
        problemId: separationProblem.id,
        userId: internalUser.id,
      },
    },
    update: {},
    create: {
      problemId: separationProblem.id,
      userId: internalUser.id,
    },
  });

  const roadmapItem =
    (await prisma.roadmapItem.findFirst({
      where: { title: "Otimizar fluxo de separacao WMS" },
    })) ??
    (await prisma.roadmapItem.create({
      data: {
        productId: wmsProduct.id,
        title: "Otimizar fluxo de separacao WMS",
        description:
          "Reducao de latencia na tela de separacao com melhorias de consulta e cache.",
        status: "in_progress",
        targetMonthOrQuarter: "2026-Q2",
      },
    }));

  await prisma.problemRoadmap.upsert({
    where: {
      problemId_roadmapItemId: {
        problemId: separationProblem.id,
        roadmapItemId: roadmapItem.id,
      },
    },
    update: {},
    create: {
      problemId: separationProblem.id,
      roadmapItemId: roadmapItem.id,
    },
  });

  if (
    !(await prisma.comment.findFirst({
      where: {
        problemId: separationProblem.id,
        userId: customerUser.id,
        text: "Acontece com mais frequencia no fim da tarde.",
      },
    }))
  ) {
    await prisma.comment.create({
      data: {
        problemId: separationProblem.id,
        userId: customerUser.id,
        text: "Acontece com mais frequencia no fim da tarde.",
      },
    });
  }
  if (
    !(await prisma.comment.findFirst({
      where: {
        problemId: separationProblem.id,
        userId: internalUser.id,
        text: "Estamos monitorando e validando ganho de performance.",
      },
    }))
  ) {
    await prisma.comment.create({
      data: {
        problemId: separationProblem.id,
        userId: internalUser.id,
        text: "Estamos monitorando e validando ganho de performance.",
      },
    });
  }

  console.log("Seeded:", {
    products: products.length,
    internalUser: internalUser.email,
    customerUser: customerUser.email,
    problems: 2,
    roadmapItems: 1,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

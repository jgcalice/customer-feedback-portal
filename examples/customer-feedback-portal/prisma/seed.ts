import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const productNames = ["WMS", "Roteirização", "ERP"];
  const products = [];
  for (const name of productNames) {
    const existing = await prisma.product.findFirst({ where: { name } });
    if (existing) {
      products.push(existing);
    } else {
      products.push(await prisma.product.create({ data: { name } }));
    }
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const internalUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      password: hashedPassword,
      role: "internal",
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Customer",
      password: await bcrypt.hash("customer123", 10),
      role: "customer",
    },
  });

  console.log("Seeded:", {
    products: products.length,
    internalUser: internalUser.email,
    customerUser: customerUser.email,
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

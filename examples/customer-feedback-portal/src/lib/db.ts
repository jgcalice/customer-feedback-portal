import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  // Resolve to absolute path so it works from any cwd (e.g. Next.js on Windows).
  const filePart = raw.startsWith("file:") ? raw.slice("file:".length) : raw;
  const absolutePath = path.isAbsolute(filePart)
    ? filePart
    : path.resolve(process.cwd(), filePart);
  const url = `file:${absolutePath}` as const;

  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

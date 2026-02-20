import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

function parseMysqlUrl(url: string) {
  const withoutScheme = url.replace(/^mysql:\/\//i, "");
  const atIndex = withoutScheme.lastIndexOf("@");

  if (atIndex === -1) {
    throw new Error("Invalid DATABASE_URL: missing host section");
  }

  const credentials = withoutScheme.slice(0, atIndex);
  const hostAndDb = withoutScheme.slice(atIndex + 1);

  const [rawUser, ...rawPasswordParts] = credentials.split(":");
  const rawPassword = rawPasswordParts.join(":");

  const slashIndex = hostAndDb.indexOf("/");
  if (slashIndex === -1) {
    throw new Error("Invalid DATABASE_URL: missing database name");
  }

  const hostPort = hostAndDb.slice(0, slashIndex);
  const dbNameWithQuery = hostAndDb.slice(slashIndex + 1);
  const dbName = dbNameWithQuery.split("?")[0];

  const [host, rawPort] = hostPort.split(":");

  return {
    host,
    port: rawPort ? Number(rawPort) : 3306,
    user: decodeURIComponent(rawUser),
    password: decodeURIComponent(rawPassword),
    database: decodeURIComponent(dbName),
  };
}

const connection = parseMysqlUrl(databaseUrl);

const adapter = new PrismaMariaDb({
  ...connection,
  allowPublicKeyRetrieval: true,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

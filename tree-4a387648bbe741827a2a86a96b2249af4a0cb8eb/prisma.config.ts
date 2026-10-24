import "dotenv/config";
import { defineConfig } from "prisma/config";

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = "postgresql://localhost:5432/stocksense";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

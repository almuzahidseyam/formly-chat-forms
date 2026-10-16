import { loadEnvConfig } from "@next/env";
import { database, closeDatabase } from "../src/lib/db";

async function main() {
  loadEnvConfig(process.cwd());
  try {
    await database();
    console.log("PostgreSQL schema is ready.");
  } finally {
    await closeDatabase();
  }
}

main().catch((error: unknown) => {
  console.error("Database initialization failed. Check your PostgreSQL connection settings.");
  if (error instanceof Error)
    console.error(error.name, error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]"));
  process.exitCode = 1;
});

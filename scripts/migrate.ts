import nextEnv from "@next/env";
import { database, closeDatabase } from "../src/lib/db";

nextEnv.loadEnvConfig(process.cwd());
await database();
console.log("PostgreSQL schema is ready.");
await closeDatabase();

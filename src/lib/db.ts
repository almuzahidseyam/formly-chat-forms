import { mkdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import type { PGlite } from "@electric-sql/pglite";

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
  password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL, description text NOT NULL DEFAULT '', questions jsonb NOT NULL,
  settings jsonb NOT NULL, published jsonb, published_revision uuid,
  draft_revision uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forms_owner_idx ON forms(owner_id);
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY, form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  form_title text NOT NULL, answers jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS submissions_form_idx ON submissions(form_id, created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL
);
`;

type Database = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<T[]>;
  close(): Promise<void>;
};
const state = globalThis as typeof globalThis & {
  formlyDb?: Promise<Database>;
  formlyPglite?: PGlite;
};

async function connect(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const sql = postgres(process.env.DATABASE_URL, {
      max: 3,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 15,
      onnotice: () => {},
    });
    // Serializes first-run migration across concurrent serverless cold starts.
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(7102601)`;
      await tx.unsafe(SCHEMA);
    });
    return {
      query: async <T extends Record<string, unknown>>(query: string, values: unknown[] = []) => {
        // postgres.js serializes JSON parameters itself. Mark JSON explicitly to avoid
        // storing a JSON string inside jsonb when the repository supplies JSON text.
        const parameters = values.map((value, index) =>
          typeof value === "string" && new RegExp(`\\$${index + 1}::jsonb\\b`).test(query)
            ? sql.json(JSON.parse(value))
            : value,
        );
        return Array.from(await sql.unsafe(query, parameters as never[])) as T[];
      },
      close: async () => {
        await sql.end({ timeout: 2 });
      },
    };
  }
  if (process.env.VERCEL || process.env.REQUIRE_REMOTE_DATABASE === "true") {
    throw new Error(
      "DATABASE_URL is required for hosted deployments. Configure a PostgreSQL database before deploying.",
    );
  }
  const directory = path.resolve(
    /*turbopackIgnore: true*/ process.env.LOCAL_DATABASE_PATH || ".data/formly",
  );
  await mkdir(directory, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(directory);
  state.formlyPglite = db;
  await db.exec(SCHEMA);
  return {
    query: async <T extends Record<string, unknown>>(query: string, values: unknown[] = []) =>
      (await db.query<T>(query, values)).rows,
    close: async () => {
      await db.close();
    },
  };
}

export async function database(): Promise<Database> {
  state.formlyDb ??= connect().catch((error) => {
    state.formlyDb = undefined;
    throw error;
  });
  return state.formlyDb;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  return (await database()).query<T>(sql, values);
}

export async function closeDatabase() {
  const db = state.formlyDb;
  state.formlyDb = undefined;
  state.formlyPglite = undefined;
  if (db) await (await db).close();
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { closeDatabase, query } from "../src/lib/db";

test("local PostgreSQL persists JSONB and rows across connection restarts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "formly-storage-test-"));
  process.env.DATABASE_URL = "";
  process.env.LOCAL_DATABASE_PATH = directory;
  delete process.env.VERCEL;
  const id = randomUUID();
  try {
    await query("INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)", [
      id,
      "Storage test",
      `${id}@example.com`,
      "test-only",
    ]);
    const formId = randomUUID();
    await query(
      "INSERT INTO forms(id,owner_id,title,questions,settings,draft_revision) VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)",
      [
        formId,
        id,
        "Persistence test",
        JSON.stringify([{ label: "A real PostgreSQL question" }]),
        JSON.stringify({ color: "#c8532e" }),
        randomUUID(),
      ],
    );
    await closeDatabase();
    const rows = await query("SELECT title,questions,settings FROM forms WHERE id=$1", [formId]);
    assert.equal(rows[0].title, "Persistence test");
    assert.deepEqual(rows[0].settings, { color: "#c8532e" });
    assert.deepEqual(rows[0].questions, [{ label: "A real PostgreSQL question" }]);
  } finally {
    await closeDatabase();
    assert.ok(directory.startsWith(join(tmpdir(), "formly-storage-test-")));
    await rm(directory, { recursive: true, force: true });
  }
});

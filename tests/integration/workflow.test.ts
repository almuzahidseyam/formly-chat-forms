import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { FormRecord, Question } from "../../src/lib/types";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
type ApiForm = FormRecord & { draft_revision: string };
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
  extraHeaders: Record<string, string> = {},
) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...extraHeaders,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  const data = await response.json().catch(() => ({}));
  return {
    status: response.status,
    data,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
    headers: response.headers,
  };
}

test("complete database-backed ownership, publishing and submission workflow", async (t) => {
  const nonce = randomUUID();
  const password = `Test-only-${randomUUID()}`;
  let owner = "",
    other = "";
  let form: ApiForm;
  let publishedRevision = "";
  let payload: {
    revision: string;
    submissionId: string;
    answers: { questionId: string; value: string }[];
  };

  await t.test("protected endpoints reject anonymous requests", async () =>
    assert.equal((await call("/api/forms")).status, 401),
  );
  await t.test("database health endpoint responds", async () =>
    assert.equal((await call("/api/health")).data.status, "ok"),
  );
  await t.test("two accounts get separate secure sessions", async () => {
    const a = await call("/api/auth/signup", "POST", {
      name: "QA Owner",
      email: `owner-${nonce}@example.com`,
      password,
    });
    const b = await call("/api/auth/signup", "POST", {
      name: "QA Other",
      email: `other-${nonce}@example.com`,
      password,
    });
    assert.equal(a.status, 201);
    assert.equal(b.status, 201);
    owner = a.cookie!;
    other = b.cookie!;
    assert.ok(a.headers.get("set-cookie")?.includes("HttpOnly"));
    assert.ok(a.headers.get("set-cookie")?.includes("SameSite=lax"));
    assert.ok(!("password_hash" in a.data.user));
  });
  await t.test("cross-origin owner mutations are blocked", async () =>
    assert.equal(
      (await call("/api/forms", "POST", {}, owner, { origin: "https://evil.example" })).status,
      403,
    ),
  );
  await t.test("create a new form as a draft", async () => {
    const result = await call("/api/forms", "POST", {}, owner);
    assert.equal(result.status, 201);
    form = result.data.form;
    assert.equal(form.published, null);
    assert.equal((await call(`/api/public/${form.id}`)).status, 404);
  });
  await t.test("other users cannot read, edit, delete or inspect responses", async () => {
    for (const [path, method, body] of [
      [`/api/forms/${form.id}`, "GET", undefined],
      [`/api/forms/${form.id}`, "PUT", form],
      [`/api/forms/${form.id}`, "DELETE", undefined],
      [`/api/forms/${form.id}/submissions`, "GET", undefined],
      [`/api/forms/${form.id}/publish`, "POST", { draft_revision: form.draft_revision }],
    ] as const) {
      assert.equal((await call(path, method, body, other)).status, 404);
    }
  });
  await t.test("incomplete draft saves, but cannot publish", async () => {
    const updated = { ...form, questions: [{ ...form.questions[0], label: "" }] };
    const result = await call(`/api/forms/${form.id}`, "PUT", updated, owner);
    assert.equal(result.status, 200);
    form = result.data.form;
    assert.equal(
      (
        await call(
          `/api/forms/${form.id}/publish`,
          "POST",
          { draft_revision: form.draft_revision },
          owner,
        )
      ).status,
      400,
    );
  });
  await t.test("all four question types save and publish", async () => {
    const questions: Question[] = [
      { id: randomUUID(), type: "text", label: "Your name?", required: true, options: [] },
      { id: randomUUID(), type: "email", label: "Your email?", required: true, options: [] },
      {
        id: randomUUID(),
        type: "multiple_choice",
        label: "Your team?",
        required: true,
        options: ["Design", "Engineering"],
      },
      {
        id: randomUUID(),
        type: "yes_no",
        label: "Can we follow up?",
        required: false,
        options: [],
      },
    ];
    const old = form;
    const saved = await call(
      `/api/forms/${form.id}`,
      "PUT",
      { ...form, title: "QA conversation", questions },
      owner,
    );
    assert.equal(saved.status, 200);
    form = saved.data.form;
    assert.equal((await call(`/api/forms/${form.id}`, "PUT", old, owner)).status, 409);
    const result = await call(
      `/api/forms/${form.id}/publish`,
      "POST",
      { draft_revision: form.draft_revision },
      owner,
    );
    assert.equal(result.status, 200);
    form = result.data.form;
    const pub = await call(`/api/public/${form.id}`);
    assert.equal(pub.status, 200);
    assert.ok(!("owner_id" in pub.data.form));
    publishedRevision = pub.data.form.revision;
    payload = {
      revision: publishedRevision,
      submissionId: randomUUID(),
      answers: questions.map((q, i) => ({
        questionId: q.id,
        value: ["Browser test", "test@example.com", "Engineering", "Yes"][i],
      })),
    };
  });
  await t.test("required, email, choice and yes/no validation happens on the server", async () => {
    for (const [index, value] of [
      [0, " "],
      [1, "not-an-email"],
      [2, "Unlisted"],
      [3, "Maybe"],
    ] as const) {
      const answers = payload.answers.map((a, i) => (i === index ? { ...a, value } : a));
      assert.equal(
        (await call(`/api/public/${form.id}/submissions`, "POST", { ...payload, answers })).status,
        400,
      );
    }
    assert.equal(
      (await call(`/api/public/${form.id}/submissions`, "POST", { ...payload, answers: [] }))
        .status,
      400,
    );
    assert.equal(
      (
        await call(`/api/public/${form.id}/submissions`, "POST", {
          ...payload,
          website: "bot-filled",
        })
      ).status,
      400,
    );
  });
  await t.test("response is saved once, and retries are idempotent", async () => {
    const path = `/api/public/${form.id}/submissions`;
    assert.equal((await call(path, "POST", payload)).status, 201);
    assert.equal((await call(path, "POST", payload)).status, 201);
    const result = await call(`/api/forms/${form.id}/submissions`, "GET", undefined, owner);
    assert.equal(result.data.submissions.length, 1);
    assert.equal(result.data.submissions[0].answers[1].value, "test@example.com");
    assert.ok(result.data.submissions[0].created_at);
  });
  await t.test(
    "editing a draft keeps the published form and saved question labels stable",
    async () => {
      const result = await call(
        `/api/forms/${form.id}`,
        "PUT",
        {
          ...form,
          questions: form.questions.map((q, i) =>
            i ? q : { ...q, label: "Changed draft question" },
          ),
        },
        owner,
      );
      assert.equal(result.status, 200);
      form = result.data.form;
      const pub = await call(`/api/public/${form.id}`);
      assert.equal(pub.data.form.questions[0].label, "Your name?");
      const subs = await call(`/api/forms/${form.id}/submissions`, "GET", undefined, owner);
      assert.equal(subs.data.submissions[0].answers[0].label, "Your name?");
    },
  );
  await t.test("republishing invalidates stale submissions", async () => {
    const pub = await call(
      `/api/forms/${form.id}/publish`,
      "POST",
      { draft_revision: form.draft_revision },
      owner,
    );
    assert.equal(pub.status, 200);
    form = pub.data.form;
    assert.notEqual(form.published_revision, publishedRevision);
    assert.equal(
      (
        await call(`/api/public/${form.id}/submissions`, "POST", {
          ...payload,
          submissionId: randomUUID(),
        })
      ).status,
      409,
    );
  });
  await t.test("unpublish blocks public access while preserving saved responses", async () => {
    assert.equal(
      (await call(`/api/forms/${form.id}/unpublish`, "POST", undefined, owner)).status,
      200,
    );
    assert.equal((await call(`/api/public/${form.id}`)).status, 404);
    assert.equal(
      (
        await call(`/api/public/${form.id}/submissions`, "POST", {
          ...payload,
          revision: form.published_revision,
        })
      ).status,
      404,
    );
    assert.equal(
      (await call(`/api/forms/${form.id}/submissions`, "GET", undefined, owner)).data.submissions
        .length,
      1,
    );
  });
  await t.test("delete removes the form and its responses", async () => {
    assert.equal((await call(`/api/forms/${form.id}`, "DELETE", undefined, owner)).status, 200);
    assert.equal((await call(`/api/forms/${form.id}`, "GET", undefined, owner)).status, 404);
    assert.equal(
      (await call(`/api/forms/${form.id}/submissions`, "GET", undefined, owner)).status,
      404,
    );
    assert.deepEqual((await call("/api/forms", "GET", undefined, owner)).data.forms, []);
  });
  await t.test("sign-in rejects wrong passwords and permits the correct one", async () => {
    const body = { email: `owner-${nonce}@example.com`, password: "incorrect-password" };
    assert.equal((await call("/api/auth/login", "POST", body)).status, 401);
    const good = await call("/api/auth/login", "POST", { ...body, password });
    assert.equal(good.status, 200);
    owner = good.cookie!;
  });
  await t.test("logout revokes the server session", async () => {
    assert.equal((await call("/api/auth/logout", "POST", undefined, owner)).status, 200);
    assert.equal((await call("/api/forms", "GET", undefined, owner)).status, 401);
    await call("/api/auth/logout", "POST", undefined, other);
  });
});

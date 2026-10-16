import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  answerError,
  formSchema,
  publishErrors,
  signupSchema,
  submissionSchema,
  validateAnswers,
} from "../src/lib/validation";
import { createDefinition } from "../src/lib/templates";
import { colorText, stableJson } from "../src/lib/client";
import type { Question } from "../src/lib/types";

const question = (type: Question["type"], required = true): Question => ({
  id: randomUUID(),
  type,
  required,
  label: "A question",
  options: type === "multiple_choice" ? ["One", "Two"] : [],
});

test("required answers reject whitespace", () => assert.ok(answerError(question("text"), "   ")));
test("optional questions accept a skip", () =>
  assert.equal(answerError(question("text", false), ""), null));
test("email validation rejects invalid addresses", () =>
  assert.ok(answerError(question("email"), "invalid@")));
test("email validation accepts and trims a valid address", () =>
  assert.equal(answerError(question("email"), " alex@example.com "), null));
test("multiple choice rejects answers outside the provided options", () =>
  assert.ok(answerError(question("multiple_choice"), "Three")));
test("multiple choice accepts an available answer", () =>
  assert.equal(answerError(question("multiple_choice"), "Two"), null));
test("yes/no validation is explicit", () => {
  assert.ok(answerError(question("yes_no"), "Maybe"));
  assert.equal(answerError(question("yes_no"), "No"), null);
});
test("long text answers are rejected", () =>
  assert.ok(answerError(question("text"), "a".repeat(2001))));
test("missing required questions are rejected server-side", () =>
  assert.ok(validateAnswers([question("text")], [])));
test("unknown question IDs are rejected", () =>
  assert.ok(validateAnswers([], [{ questionId: randomUUID(), value: "x" }])));
test("duplicate answers are rejected", () => {
  const q = question("text");
  assert.ok(
    validateAnswers(
      [q],
      [
        { questionId: q.id, value: "a" },
        { questionId: q.id, value: "b" },
      ],
    ),
  );
});
test("form drafts may contain incomplete questions", () => {
  const form = createDefinition();
  form.questions[0].label = "";
  assert.equal(formSchema.safeParse(form).success, true);
  assert.ok(publishErrors(form).length);
});
test("empty forms cannot be published", () => {
  const form = createDefinition();
  form.questions = [];
  assert.ok(publishErrors(form).length);
});
test("choice options are unique, ignoring case", () => {
  const form = createDefinition();
  form.questions = [{ ...question("multiple_choice"), options: ["Yes", "yes"] }];
  assert.ok(publishErrors(form).some((e) => e.includes("duplicate")));
});
test("choice questions need at least two non-empty options", () => {
  const form = createDefinition();
  form.questions = [{ ...question("multiple_choice"), options: ["One", ""] }];
  assert.ok(publishErrors(form).length);
});
test("form schema rejects duplicate question IDs", () => {
  const form = createDefinition();
  form.questions.push({ ...form.questions[0] });
  assert.equal(formSchema.safeParse(form).success, false);
});
test("form limits are enforced", () => {
  const form = createDefinition();
  form.questions = Array.from({ length: 31 }, () => question("text"));
  assert.equal(formSchema.safeParse(form).success, false);
});
test("CSS injection is rejected in theme colors", () => {
  const form = createDefinition();
  form.settings.color = "red;display:none";
  assert.equal(formSchema.safeParse(form).success, false);
});
test("signup normalizes email and enforces password length", () => {
  const data = signupSchema.parse({
    name: "Alex",
    email: "Alex@EXAMPLE.COM",
    password: "long-password",
  });
  assert.equal(data.email, "alex@example.com");
  assert.equal(signupSchema.safeParse({ ...data, password: "short" }).success, false);
});
test("demo email domain is reserved", () =>
  assert.equal(
    signupSchema.safeParse({
      name: "Alex",
      email: "alex@demo.formly.local",
      password: "long-password",
    }).success,
    false,
  ));
test("all starter templates are valid and publishable", () => {
  for (const id of ["feedback", "contact", "research"]) {
    const form = createDefinition(id);
    assert.equal(formSchema.safeParse(form).success, true);
    assert.deepEqual(publishErrors(form), []);
  }
});
test("template instances never share question IDs", () => {
  const a = createDefinition("feedback");
  const b = createDefinition("feedback");
  assert.ok(a.questions.every((q) => !b.questions.some((other) => other.id === q.id)));
});
test("submission IDs and revisions must be valid UUIDs", () =>
  assert.equal(
    submissionSchema.safeParse({ revision: "fake", submissionId: "fake", answers: [] }).success,
    false,
  ));
test("theme foreground remains readable at both extremes", () => {
  assert.equal(colorText("#ffffff"), "#17211b");
  assert.equal(colorText("#000000"), "#ffffff");
});
test("published snapshot comparisons ignore JSONB key ordering", () =>
  assert.equal(
    stableJson({ a: 1, b: [{ c: 2, d: 3 }] }),
    stableJson({ b: [{ d: 3, c: 2 }], a: 1 }),
  ));

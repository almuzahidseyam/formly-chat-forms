import { z } from "zod";
import type { Answer, FormDefinition, Question } from "./types";

const questionSchema = z.object({
  id: z.uuid(),
  type: z.enum(["text", "email", "multiple_choice", "yes_no"]),
  label: z.string().trim().max(200),
  required: z.boolean(),
  options: z.array(z.string().trim().max(100)).max(10),
});
export const formSchema = z
  .object({
    title: z.string().trim().min(1, "Give your form a title.").max(100),
    description: z.string().trim().max(500),
    questions: z.array(questionSchema).max(30),
    settings: z.object({
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid color."),
      welcome: z.string().trim().min(1).max(500),
      completion: z.string().trim().min(1).max(500),
      buttonLabel: z.string().trim().min(1).max(30),
    }),
  })
  .superRefine((form, ctx) => {
    if (new Set(form.questions.map((q) => q.id)).size !== form.questions.length)
      ctx.addIssue({
        code: "custom",
        message: "Each question must have a unique ID.",
        path: ["questions"],
      });
  });
export const credentialsSchema = z.object({
  email: z
    .email("Enter a valid email address.")
    .max(254)
    .transform((v) => v.toLowerCase())
    .refine((v) => !v.endsWith("@demo.formly.local"), "Use your own email address."),
  password: z.string().min(10, "Use at least 10 characters.").max(128),
});
export const signupSchema = credentialsSchema.extend({ name: z.string().trim().min(2).max(80) });
export const submissionSchema = z.object({
  revision: z.uuid(),
  submissionId: z.uuid(),
  answers: z.array(z.object({ questionId: z.uuid(), value: z.string().max(2000) })).max(30),
  website: z.string().max(200).optional(),
});

export function publishErrors(form: FormDefinition): string[] {
  const errors: string[] = [];
  if (!form.questions.length) errors.push("Add at least one question before publishing.");
  form.questions.forEach((q, i) => {
    if (!q.label.trim()) errors.push(`Question ${i + 1} needs a label.`);
    if (q.type === "multiple_choice") {
      const options = q.options.map((o) => o.trim());
      if (options.length < 2 || options.some((o) => !o))
        errors.push(`Question ${i + 1} needs at least two non-empty options.`);
      if (new Set(options.map((o) => o.toLowerCase())).size !== options.length)
        errors.push(`Question ${i + 1} has duplicate options.`);
    }
  });
  return errors;
}

export function answerError(question: Question, value: string): string | null {
  const cleaned = value.trim();
  if (!cleaned) return question.required ? "This question needs an answer." : null;
  if (cleaned.length > 2000) return "Keep your answer under 2,000 characters.";
  if (question.type === "email" && !z.email().max(254).safeParse(cleaned).success)
    return "That email doesn't look right. Try name@example.com.";
  if (question.type === "multiple_choice" && !question.options.includes(cleaned))
    return "Choose one of the available answers.";
  if (question.type === "yes_no" && !["Yes", "No"].includes(cleaned)) return "Choose Yes or No.";
  return null;
}

export function validateAnswers(questions: Question[], answers: Answer[]): string | null {
  if (new Set(answers.map((a) => a.questionId)).size !== answers.length)
    return "Duplicate answers are not allowed.";
  if (answers.some((a) => !questions.some((q) => q.id === a.questionId)))
    return "An answer refers to an unknown question.";
  for (const q of questions) {
    const error = answerError(q, answers.find((a) => a.questionId === q.id)?.value ?? "");
    if (error) return `${q.label}: ${error}`;
  }
  return null;
}

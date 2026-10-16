export type QuestionType = "text" | "email" | "multiple_choice" | "yes_no";
export type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options: string[];
};
export type FormSettings = {
  color: string;
  welcome: string;
  completion: string;
  buttonLabel: string;
};
export type FormDefinition = {
  title: string;
  description: string;
  questions: Question[];
  settings: FormSettings;
};
export type FormRecord = FormDefinition & {
  id: string;
  published: FormDefinition | null;
  published_revision: string | null;
  response_count: number;
  created_at: string;
  updated_at: string;
};
export type PublicForm = FormDefinition & { id: string; revision: string };
export type Answer = { questionId: string; value: string };
export type SavedAnswer = Answer & { label: string; type: QuestionType };
export type Submission = {
  id: string;
  form_id: string;
  form_title: string;
  answers: SavedAnswer[];
  created_at: string;
};
export type User = { id: string; name: string; email: string };

export const DEFAULT_SETTINGS: FormSettings = {
  color: "#c8532e",
  welcome: "Hi there! We'd love to hear from you. Ready for a few quick questions?",
  completion: "You're all set. Thanks for sharing your thoughts with us!",
  buttonLabel: "Let's talk",
};

export const QUESTION_LABELS: Record<QuestionType, string> = {
  text: "Short text",
  email: "Email address",
  multiple_choice: "Multiple choice",
  yes_no: "Yes / No",
};

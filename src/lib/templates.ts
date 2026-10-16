import { DEFAULT_SETTINGS, type FormDefinition, type QuestionType } from "./types";

export const TEMPLATES = [
  {
    id: "feedback",
    title: "Customer feedback",
    description: "Learn what your customers love. And what could be better.",
    icon: "heart",
    color: "#c8532e",
    count: 4,
  },
  {
    id: "contact",
    title: "Say hello",
    description: "Turn a website visit into your next conversation.",
    icon: "message",
    color: "#476c58",
    count: 4,
  },
  {
    id: "research",
    title: "Product research",
    description: "Get closer to the people you're building for.",
    icon: "sparkle",
    color: "#6d5a91",
    count: 4,
  },
] as const;

export function createDefinition(template?: string): FormDefinition {
  const q = (type: QuestionType, label: string, options: string[] = [], required = true) => ({
    id: crypto.randomUUID(),
    type,
    label,
    options,
    required,
  });
  if (template === "feedback")
    return {
      title: "Customer feedback",
      description: "A few little questions. A big difference to us.",
      settings: {
        ...DEFAULT_SETTINGS,
        welcome: "Hey! Thanks for being here. We'd love to know how we're doing.",
      },
      questions: [
        q("text", "What should we call you?"),
        q("multiple_choice", "How was your experience?", [
          "Loved it",
          "Pretty good",
          "Could be better",
        ]),
        q("text", "What's one thing we could do better?", [], false),
        q("email", "Where can we reach you?", [], false),
      ],
    };
  if (template === "contact")
    return {
      title: "Say hello",
      description: "Tell us a little about yourself. We'll take it from there.",
      settings: {
        ...DEFAULT_SETTINGS,
        color: "#476c58",
        welcome: "Hi! Nice to meet you. Let's start a conversation.",
      },
      questions: [
        q("text", "What's your name?"),
        q("email", "What's your email address?"),
        q("multiple_choice", "What would you like to talk about?", [
          "A new project",
          "A question",
          "Something else",
        ]),
        q("text", "What do you have in mind?"),
      ],
    };
  if (template === "research")
    return {
      title: "Product research",
      description: "Help shape what comes next.",
      settings: { ...DEFAULT_SETTINGS, color: "#6d5a91" },
      questions: [
        q("text", "What's your role?"),
        q("multiple_choice", "How often would you use this product?", [
          "Every day",
          "A few times a week",
          "Occasionally",
        ]),
        q("yes_no", "Would you recommend it to a friend?"),
        q("text", "What's missing for you?", [], false),
      ],
    };
  return {
    title: "Untitled form",
    description: "",
    questions: [q("text", "What's your name?")],
    settings: { ...DEFAULT_SETTINGS },
  };
}

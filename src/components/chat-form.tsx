"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { api, colorText } from "@/lib/client";
import { answerError } from "@/lib/validation";
import type { FormDefinition, PublicForm } from "@/lib/types";
import { Button } from "./ui";

export function ChatForm({
  form,
  preview = false,
  autoStart = false,
  embedded = false,
}: {
  form: FormDefinition | PublicForm;
  preview?: boolean;
  autoStart?: boolean;
  embedded?: boolean;
}) {
  const [started, setStarted] = useState(autoStart);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const [website, setWebsite] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const question = form.questions[step];
  const review = started && step >= form.questions.length;
  const style = {
    "--chat-color": form.settings.color,
    "--chat-ink": colorText(form.settings.color),
  } as CSSProperties;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    if (started && question && !["yes_no", "multiple_choice"].includes(question.type))
      inputRef.current?.focus({ preventScroll: true });
  }, [step, started, done, question]);
  useEffect(() => {
    if (!embedded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.parent.postMessage({ type: "formly:close" }, "*");
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [embedded]);

  function next(value: string) {
    if (!question || busy) return;
    const issue = answerError(question, value);
    if (issue) {
      setError(issue);
      return;
    }
    setAnswers((a) => ({ ...a, [question.id]: value.trim() }));
    setError("");
    setStep((s) => s + 1);
  }

  async function submit() {
    setError("");
    setBusy(true);
    try {
      if (!preview && "revision" in form)
        await api(`/api/public/${form.id}/submissions`, "POST", {
          revision: form.revision,
          submissionId,
          website,
          answers: form.questions.map((q) => ({ questionId: q.id, value: answers[q.id] ?? "" })),
        });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send your response. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setDone(false);
    setStarted(false);
    setError("");
    setSubmissionId(crypto.randomUUID());
  }

  return (
    <section
      className={`chat ${embedded ? "chat-embedded" : ""}`}
      style={style}
      aria-label={`${form.title} conversational form`}
    >
      <header className="chat-header">
        <span className="chat-avatar">
          <MessageCircle size={20} />
        </span>
        <div>
          <strong>{form.title}</strong>
          <span>
            <i className="online-dot" />
            {preview ? "Interactive preview" : "Here to listen"}
          </span>
        </div>
        {embedded && (
          <button
            className="icon-button"
            aria-label="Close chat"
            onClick={() => window.parent.postMessage({ type: "formly:close" }, "*")}
          >
            <X size={19} />
          </button>
        )}
      </header>
      {started && !done && (
        <div
          className="chat-progress"
          role="progressbar"
          aria-label="Form progress"
          aria-valuenow={Math.min(step, form.questions.length)}
          aria-valuemin={0}
          aria-valuemax={form.questions.length}
        >
          <span
            style={{
              width: `${form.questions.length ? (step / form.questions.length) * 100 : 0}%`,
            }}
          />
        </div>
      )}
      <div className="chat-body" ref={scrollRef} aria-live="polite">
        <div className="chat-day">{preview ? "LET'S TRY IT OUT" : "A LITTLE CONVERSATION"}</div>
        <div className="bubble-row">
          <span className="tiny-avatar">
            <MessageCircle size={13} />
          </span>
          <div className="bubble bubble-bot">{form.settings.welcome}</div>
        </div>
        {!started && !done && (
          <div className="chat-start">
            <button className="chat-action" onClick={() => setStarted(true)}>
              {form.settings.buttonLabel}
              <ArrowRight size={16} />
            </button>
            <span>{form.questions.length} questions · Your own pace</span>
          </div>
        )}
        {started &&
          form.questions.slice(0, step).map((q, i) => (
            <div key={q.id} className="chat-exchange">
              <div className="bubble-row">
                <span className="tiny-avatar">
                  <MessageCircle size={13} />
                </span>
                <div className="bubble bubble-bot">{q.label}</div>
              </div>
              <div className="bubble-row bubble-row-user">
                <div className="bubble bubble-user">
                  {answers[q.id] || "Skipped"}
                  <CheckCheck size={12} />
                </div>
              </div>
              {i === step - 1 && <span className="chat-read">Received</span>}
            </div>
          ))}
        {started && question && !done && (
          <div className="bubble-row">
            <span className="tiny-avatar">
              <MessageCircle size={13} />
            </span>
            <div className="bubble bubble-bot">
              {question.label || "Your question will appear here."}
              {question.required && (
                <span className="required-star" aria-label="required">
                  {" "}
                  *
                </span>
              )}
            </div>
          </div>
        )}
        {review && !done && (
          <div className="bubble-row">
            <span className="tiny-avatar">
              <Check size={13} />
            </span>
            <div className="bubble bubble-bot">That's everything! Ready to send your answers?</div>
          </div>
        )}
        {done && (
          <div className="chat-complete">
            <div className="complete-check">
              <Check size={28} />
            </div>
            <h3>{preview ? "Looking good!" : "Response received."}</h3>
            <p>{form.settings.completion}</p>
            {preview && <small>This was a preview. No response was saved.</small>}
            <button className="text-button" onClick={restart}>
              <RotateCcw size={14} />
              Start again
            </button>
          </div>
        )}
      </div>
      {!done && (
        <div className="chat-input-area">
          {error && (
            <p className="field-error" id="chat-error" role="alert">
              {error}
            </p>
          )}
          {started && question && (
            <>
              <div className="question-meta">
                <span>
                  Question {step + 1} of {form.questions.length}
                </span>
                <span>{question.required ? "Required" : "Optional"}</span>
              </div>
              {["multiple_choice", "yes_no"].includes(question.type) ? (
                <div className="answer-options">
                  {(question.type === "yes_no" ? ["Yes", "No"] : question.options).map(
                    (option, index) => (
                      <button
                        key={`${index}-${option}`}
                        onClick={() => next(option)}
                        className="answer-option"
                      >
                        <span>{String.fromCharCode(65 + index)}</span>
                        {option}
                        <ArrowRight size={14} />
                      </button>
                    ),
                  )}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    next(answers[question.id] ?? "");
                  }}
                  noValidate
                  className="chat-text-input"
                >
                  <input
                    ref={inputRef}
                    type={question.type === "email" ? "email" : "text"}
                    aria-label={question.label || "Your answer"}
                    autoComplete="off"
                    maxLength={question.type === "email" ? 254 : 2000}
                    placeholder={
                      question.type === "email" ? "name@example.com" : "Type your answer…"
                    }
                    value={answers[question.id] ?? ""}
                    onChange={(e) => {
                      setAnswers((a) => ({ ...a, [question.id]: e.target.value }));
                      setError("");
                    }}
                    aria-invalid={!!error}
                    aria-describedby={error ? "chat-error" : undefined}
                  />
                  <button type="submit" aria-label="Next question">
                    <ArrowRight size={20} />
                  </button>
                </form>
              )}
              <div className="chat-nav">
                {step > 0 ? (
                  <button
                    onClick={() => {
                      setStep((s) => s - 1);
                      setError("");
                    }}
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>
                ) : (
                  <span />
                )}
                {!question.required && (
                  <button onClick={() => next("")}>
                    Skip question
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </>
          )}
          {review && (
            <div className="review-actions">
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setStep(Math.max(0, form.questions.length - 1));
                  setError("");
                }}
              >
                <ArrowLeft size={14} />
                Review answers
              </button>
              <Button onClick={submit} busy={busy} className="chat-submit">
                {preview ? "Finish preview" : "Send response"}
                <Send size={15} />
              </Button>
            </div>
          )}
          <div className="honeypot" aria-hidden="true">
            <label>
              Leave this field empty
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
      <footer className="chat-footer">
        <Link href="/" target={embedded ? "_blank" : undefined} rel="noopener">
          Made with <strong>formly.</strong>
        </Link>
        {preview && <span>Preview · answers aren't saved</span>}
      </footer>
    </section>
  );
}

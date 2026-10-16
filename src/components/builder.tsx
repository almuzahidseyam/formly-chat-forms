"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Eye,
  FileText,
  GripVertical,
  Inbox,
  List,
  Mail,
  MessageCircle,
  Palette,
  Plus,
  Save,
  Send,
  Settings2,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { api, stableJson } from "@/lib/client";
import { QUESTION_LABELS, type FormRecord, type Question, type QuestionType } from "@/lib/types";
import { ChatForm } from "./chat-form";
import { SharePanel } from "./share-panel";
import { Button, Modal, Notice } from "./ui";

type EditableForm = FormRecord & { draft_revision: string };
const ICONS = { text: Type, email: Mail, multiple_choice: List, yes_no: Check };
const COLORS = ["#c8532e", "#476c58", "#6d5a91", "#386a8a", "#9a5c18", "#252e29"];

export function Builder({ initialForm }: { initialForm: EditableForm }) {
  const [form, setForm] = useState(initialForm);
  const [selected, setSelected] = useState(initialForm.questions[0]?.id ?? "");
  const [tab, setTab] = useState<"questions" | "settings">("questions");
  const [mobilePanel, setMobilePanel] = useState<"edit" | "preview">("edit");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const dragIndex = useRef<number | null>(null);
  const selectedQuestion = form.questions.find((q) => q.id === selected);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function update(patch: Partial<EditableForm>) {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
    setMessage("");
  }
  function updateQuestion(id: string, patch: Partial<Question>) {
    update({ questions: form.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) });
  }
  function addQuestion(type: QuestionType) {
    if (form.questions.length >= 30) {
      setError("Keep this conversation to 30 questions or fewer.");
      return;
    }
    const question: Question = {
      id: crypto.randomUUID(),
      type,
      label: "",
      required: true,
      options: type === "multiple_choice" ? ["Option 1", "Option 2"] : [],
    };
    update({ questions: [...form.questions, question] });
    setSelected(question.id);
    setTab("questions");
  }
  function moveQuestion(from: number, to: number) {
    if (to < 0 || to >= form.questions.length) return;
    const questions = [...form.questions];
    const [q] = questions.splice(from, 1);
    questions.splice(to, 0, q);
    update({ questions });
  }
  function removeQuestion() {
    if (!deleteQuestion) return;
    const questions = form.questions.filter((q) => q.id !== deleteQuestion.id);
    update({ questions });
    if (selected === deleteQuestion.id) setSelected(questions[0]?.id ?? "");
    setDeleteQuestion(null);
  }
  function duplicate(q: Question) {
    const copy = { ...q, id: crypto.randomUUID(), options: [...q.options] };
    if (form.questions.length >= 30) {
      setError("Maximum 30 questions per form.");
      return;
    }
    const questions = [...form.questions];
    questions.splice(questions.findIndex((item) => item.id === q.id) + 1, 0, copy);
    update({ questions });
    setSelected(copy.id);
  }
  async function save(): Promise<EditableForm | null> {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ form: EditableForm }>(`/api/forms/${form.id}`, "PUT", form);
      setForm(result.form);
      setDirty(false);
      setMessage("All changes saved.");
      return result.form;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    const saved = dirty ? await save() : form;
    if (!saved) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ form: EditableForm }>(`/api/forms/${form.id}/publish`, "POST", {
        draft_revision: saved.draft_revision,
      });
      setForm(result.form);
      setDirty(false);
      setMessage("Your form is live. Let the conversations begin.");
      setShareOpen(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function unpublish() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ form: EditableForm }>(`/api/forms/${form.id}/unpublish`, "POST");
      setForm((f) => ({
        ...f,
        published: null,
        published_revision: null,
        updated_at: result.form.updated_at,
      }));
      setMessage("Form unpublished. Saved responses are still here.");
      setUnpublishOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const liveChanges =
    form.published &&
    stableJson({
      title: form.title,
      description: form.description,
      questions: form.questions,
      settings: form.settings,
    }) !== stableJson(form.published);
  return (
    <div className="builder-page">
      <header className="builder-header">
        <Link
          className="builder-back"
          href="/dashboard"
          onClick={(e) => {
            if (dirty) {
              e.preventDefault();
              setError("Save your changes before leaving this form.");
            }
          }}
          aria-label="Back to forms"
        >
          <ArrowLeft size={21} />
        </Link>
        <span className="builder-form-icon">
          <MessageCircle size={20} />
        </span>
        <div className="builder-title">
          <strong>{form.title}</strong>
          <span>
            <i className={`save-dot ${dirty ? "unsaved" : ""}`} />
            {dirty ? "Unsaved changes" : "All changes saved"}
            <span className={`status-badge ${form.published ? "published" : "draft"}`}>
              {form.published ? "Published" : "Draft"}
            </span>
          </span>
        </div>
        <div className="builder-header-actions">
          <button className="button button-ghost" onClick={() => setPreviewOpen(true)}>
            <Eye size={16} />
            <span>Preview</span>
          </button>
          <Button variant="secondary" busy={busy} disabled={!dirty} onClick={save}>
            <Save size={15} />
            <span>Save draft</span>
          </Button>
          <Button busy={busy} onClick={publish}>
            <Send size={15} />
            <span>{form.published ? "Publish changes" : "Publish form"}</span>
          </Button>
        </div>
      </header>
      <div className="builder-subnav">
        <div className="builder-tabs">
          <button className="active">
            <FileText size={15} />
            Build
          </button>
          <Link
            href={`/dashboard/forms/${form.id}`}
            onClick={(e) => {
              if (dirty) {
                e.preventDefault();
                setError("Save your changes before viewing responses.");
              }
            }}
          >
            <Inbox size={15} />
            Responses<span className="count-chip">{form.response_count}</span>
          </Link>
          <button onClick={() => setShareOpen(true)}>
            <Send size={15} />
            Share
          </button>
        </div>
        <span className="builder-subtitle">A little less form. A little more you.</span>
      </div>
      {(error || message || liveChanges) && (
        <div className="builder-notices">
          {error && <Notice>{error}</Notice>}
          {message && <Notice kind="success">{message}</Notice>}
          {liveChanges && (
            <Notice kind="info">
              Your published form is unchanged until you select “Publish changes”.
            </Notice>
          )}
        </div>
      )}
      <div className="builder-mobile-switch">
        <button
          className={mobilePanel === "edit" ? "active" : ""}
          onClick={() => setMobilePanel("edit")}
        >
          <Settings2 size={15} />
          Edit form
        </button>
        <button
          className={mobilePanel === "preview" ? "active" : ""}
          onClick={() => setMobilePanel("preview")}
        >
          <Eye size={15} />
          Live preview
        </button>
      </div>
      <main className={`builder-columns show-${mobilePanel}`}>
        <aside className="question-sidebar">
          <div className="builder-panel-tabs">
            <button
              className={tab === "questions" ? "active" : ""}
              onClick={() => setTab("questions")}
            >
              <List size={15} />
              Questions
            </button>
            <button
              className={tab === "settings" ? "active" : ""}
              onClick={() => setTab("settings")}
            >
              <Palette size={15} />
              Style
            </button>
          </div>
          <div className="question-list-heading">
            <span>
              {tab === "questions"
                ? `YOUR CONVERSATION · ${form.questions.length}`
                : "MAKE IT YOURS"}
            </span>
          </div>
          {tab === "questions" ? (
            <>
              <div className="question-list">
                {form.questions.map((q, index) => {
                  const Icon = ICONS[q.type];
                  return (
                    <div
                      key={q.id}
                      className={`question-list-item ${q.id === selected ? "selected" : ""}`}
                      draggable={!busy}
                      onDragStart={() => {
                        dragIndex.current = index;
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIndex.current !== null) moveQuestion(dragIndex.current, index);
                        dragIndex.current = null;
                      }}
                    >
                      <button className="question-select" onClick={() => setSelected(q.id)}>
                        <GripVertical size={13} />
                        <span className="question-type-icon">
                          <Icon size={14} />
                        </span>
                        <div>
                          <span>
                            {index + 1}. {q.label || "Untitled question"}
                          </span>
                          <small>
                            {QUESTION_LABELS[q.type]}
                            {q.required ? " · Required" : ""}
                          </small>
                        </div>
                      </button>
                      <div className="question-reorder">
                        <button
                          disabled={index === 0 || busy}
                          aria-label={`Move question ${index + 1} up`}
                          onClick={() => moveQuestion(index, index - 1)}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          disabled={index === form.questions.length - 1 || busy}
                          aria-label={`Move question ${index + 1} down`}
                          onClick={() => moveQuestion(index, index + 1)}
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="add-question-panel">
                <span>ADD A QUESTION</span>
                <div>
                  {(Object.keys(ICONS) as QuestionType[]).map((type) => {
                    const Icon = ICONS[type];
                    return (
                      <button
                        key={type}
                        disabled={busy || form.questions.length >= 30}
                        onClick={() => addQuestion(type)}
                      >
                        <Icon size={16} />
                        {QUESTION_LABELS[type]}
                        <Plus size={13} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="sidebar-footnote">
                Drag to rearrange, or use the arrows.
                <br />
                Up to 30 questions per conversation.
              </p>
            </>
          ) : (
            <div className="style-sidebar-info">
              <Palette size={28} />
              <h3>Feels like you.</h3>
              <p>A color, a warm welcome, and a thoughtful goodbye make all the difference.</p>
            </div>
          )}
        </aside>
        <section className="question-editor">
          <fieldset disabled={busy} className="editor-fieldset">
            {tab === "questions" ? (
              <>
                <div className="editor-section-title">
                  <span className="eyebrow">THE BIG PICTURE</span>
                  <h2>A name for your conversation.</h2>
                </div>
                <label className="editor-field">
                  Form title
                  <input
                    value={form.title}
                    maxLength={100}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder="e.g. A little customer feedback"
                  />
                </label>
                <label className="editor-field">
                  Description <span className="optional-label">Optional</span>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="A few words about what you're asking."
                  />
                </label>
                <div className="editor-divider" />
                {selectedQuestion ? (
                  <>
                    <div className="question-editor-heading">
                      <div>
                        <span className="eyebrow">
                          QUESTION {form.questions.findIndex((q) => q.id === selected) + 1}
                        </span>
                        <h2>What would you like to ask?</h2>
                      </div>
                      <div>
                        <button
                          className="icon-button"
                          aria-label="Duplicate selected question"
                          title="Duplicate question"
                          onClick={() => duplicate(selectedQuestion)}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="icon-button delete-button"
                          aria-label="Delete selected question"
                          onClick={() => setDeleteQuestion(selectedQuestion)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <label className="editor-field">
                      Question type
                      <select
                        value={selectedQuestion.type}
                        onChange={(e) => {
                          const type = e.target.value as QuestionType;
                          updateQuestion(selected, {
                            type,
                            options:
                              type === "multiple_choice"
                                ? selectedQuestion.options.length >= 2
                                  ? selectedQuestion.options
                                  : ["Option 1", "Option 2"]
                                : [],
                          });
                        }}
                      >
                        {Object.entries(QUESTION_LABELS).map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="editor-field">
                      Your question
                      <textarea
                        rows={3}
                        placeholder="Write it like you'd ask a friend…"
                        value={selectedQuestion.label}
                        maxLength={200}
                        onChange={(e) => updateQuestion(selected, { label: e.target.value })}
                      />
                      <small>{selectedQuestion.label.length}/200 characters</small>
                    </label>
                    {selectedQuestion.type === "multiple_choice" && (
                      <div className="options-editor">
                        <span className="field-label">Answer choices</span>
                        {selectedQuestion.options.map((option, i) => (
                          <div className="option-editor-row" key={i}>
                            <span>{String.fromCharCode(65 + i)}</span>
                            <input
                              aria-label={`Answer option ${i + 1}`}
                              maxLength={100}
                              value={option}
                              onChange={(e) =>
                                updateQuestion(selected, {
                                  options: selectedQuestion.options.map((o, n) =>
                                    n === i ? e.target.value : o,
                                  ),
                                })
                              }
                            />
                            <button
                              className="icon-button"
                              aria-label={`Remove answer option ${i + 1}`}
                              disabled={selectedQuestion.options.length <= 2}
                              onClick={() =>
                                updateQuestion(selected, {
                                  options: selectedQuestion.options.filter((_, n) => n !== i),
                                })
                              }
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="text-button"
                          disabled={selectedQuestion.options.length >= 10}
                          onClick={() =>
                            updateQuestion(selected, { options: [...selectedQuestion.options, ""] })
                          }
                        >
                          <Plus size={14} />
                          Add an option
                        </button>
                        <small>2–10 choices. Keep each option unique.</small>
                      </div>
                    )}
                    <label className="required-control">
                      <div>
                        <strong>Required question</strong>
                        <span>Ask for an answer before moving on.</span>
                      </div>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={selectedQuestion.required}
                        onChange={(e) => updateQuestion(selected, { required: e.target.checked })}
                      />
                    </label>
                    <div className="editor-tip">
                      <MessageCircle size={17} />
                      <p>
                        {selectedQuestion.type === "email"
                          ? "We'll check the email format before accepting an answer."
                          : selectedQuestion.type === "yes_no"
                            ? "Two clear choices. Sometimes that's all you need."
                            : "Short, friendly questions tend to start the best conversations."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <Plus size={24} />
                    <h3>One question starts it all.</h3>
                    <p>Add a question from the panel to your left.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="editor-section-title">
                  <span className="eyebrow">A PERSONAL TOUCH</span>
                  <h2>Make this space your own.</h2>
                  <p>Your published widget uses these settings too.</p>
                </div>
                <div className="editor-field">
                  <span className="field-label">Accent color</span>
                  <div className="color-swatches">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        aria-label={`Choose color ${c}`}
                        aria-pressed={form.settings.color === c}
                        style={{ background: c }}
                        onClick={() => update({ settings: { ...form.settings, color: c } })}
                      >
                        {form.settings.color === c && <Check size={18} />}
                      </button>
                    ))}
                    <label className="custom-color" title="Custom accent color">
                      <input
                        type="color"
                        aria-label="Custom accent color"
                        value={form.settings.color}
                        onChange={(e) =>
                          update({ settings: { ...form.settings, color: e.target.value } })
                        }
                      />
                    </label>
                  </div>
                  <small>Button text adjusts automatically for readable contrast.</small>
                </div>
                <label className="editor-field">
                  Welcome message
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={form.settings.welcome}
                    onChange={(e) =>
                      update({ settings: { ...form.settings, welcome: e.target.value } })
                    }
                  />
                </label>
                <label className="editor-field">
                  Start button text
                  <input
                    maxLength={30}
                    value={form.settings.buttonLabel}
                    onChange={(e) =>
                      update({ settings: { ...form.settings, buttonLabel: e.target.value } })
                    }
                  />
                </label>
                <label className="editor-field">
                  Completion message
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.settings.completion}
                    onChange={(e) =>
                      update({ settings: { ...form.settings, completion: e.target.value } })
                    }
                  />
                </label>
                <div className="editor-divider" />
                <div className="publish-settings">
                  <h3>Publishing</h3>
                  <p>
                    {form.published
                      ? "Your form is live. Unpublishing stops new answers without removing saved responses."
                      : "Your form is a draft. Publish when you're ready to hear back."}
                  </p>
                  {form.published && (
                    <Button variant="secondary" onClick={() => setUnpublishOpen(true)}>
                      Unpublish form
                    </Button>
                  )}
                </div>
              </>
            )}
          </fieldset>
        </section>
        <aside className="builder-preview">
          <div className="preview-heading">
            <span>
              <i className="online-dot" />
              LIVE PREVIEW
            </span>
            <button onClick={() => setPreviewKey((k) => k + 1)}>
              Restart
              <ArrowLeft size={13} />
            </button>
          </div>
          <div className="preview-chat-frame">
            <ChatForm
              key={`${previewKey}:${form.questions.map((q) => `${q.id}:${q.type}`).join("|")}`}
              form={form}
              preview
            />
          </div>
          <p>
            <Eye size={13} />
            Try it out. Preview answers aren't saved.
          </p>
        </aside>
      </main>
      {shareOpen && (
        <Modal
          title={form.published ? "Your conversation is out there." : "Share your conversation"}
          onClose={() => setShareOpen(false)}
          wide
        >
          <SharePanel form={form} />
        </Modal>
      )}
      {previewOpen && (
        <Modal title="A little test conversation" onClose={() => setPreviewOpen(false)}>
          <div className="modal-chat">
            <ChatForm form={form} preview />
          </div>
        </Modal>
      )}
      {deleteQuestion && (
        <Modal title="Remove this question?" onClose={() => setDeleteQuestion(null)}>
          <p className="modal-description">
            Remove “{deleteQuestion.label || "Untitled question"}” from this draft? Saved responses
            keep their original question and answer.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeleteQuestion(null)}>
              Keep question
            </Button>
            <Button variant="danger" onClick={removeQuestion}>
              Remove question
            </Button>
          </div>
        </Modal>
      )}
      {unpublishOpen && (
        <Modal title="Pause this conversation?" onClose={() => setUnpublishOpen(false)}>
          <p className="modal-description">
            Your public link and widget will stop accepting responses. You can publish again any
            time.
          </p>
          {error && <Notice>{error}</Notice>}
          <div className="modal-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setUnpublishOpen(false)}>
              Keep it live
            </Button>
            <Button busy={busy} onClick={unpublish}>
              Unpublish form
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

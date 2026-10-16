"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  Heart,
  Inbox,
  LayoutGrid,
  List,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api, formatDate } from "@/lib/client";
import { TEMPLATES } from "@/lib/templates";
import type { FormRecord } from "@/lib/types";
import { Button, Modal, Notice, Timestamp } from "./ui";

export function Dashboard({ initialForms, name }: { initialForms: FormRecord[]; name: string }) {
  const router = useRouter();
  const [forms, setForms] = useState(initialForms);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const total = forms.reduce((sum, f) => sum + Number(f.response_count), 0);
  const published = forms.filter((f) => f.published).length;
  const visible = forms.filter(
    (f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || (filter === "published" ? !!f.published : !f.published)),
  );
  async function create(template?: string) {
    setBusy(true);
    setError("");
    try {
      const { form } = await api<{ form: FormRecord }>("/api/forms", "POST", { template });
      router.push(`/builder/${form.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleteTarget) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/forms/${deleteTarget.id}`, "DELETE");
      setForms((f) => f.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copy(id: string) {
    try {
      await navigator.clipboard.writeText(`${location.origin}/f/${id}`);
      setCopied(id);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      setError("Couldn't access the clipboard. Open Share & embed to select the link manually.");
    }
  }
  return (
    <main className="dashboard-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR LITTLE CORNER OF THE INTERNET</div>
          <h1>
            Hey {name.split(" ")[0]}, let's connect<span className="heading-dot">.</span>
          </h1>
          <p>Good questions lead to good things. Here's where yours live.</p>
        </div>
        <Button
          onClick={() => {
            setError("");
            setCreateOpen(true);
          }}
        >
          <Plus size={17} />
          Create a form
        </Button>
      </div>
      {error && !createOpen && !deleteTarget && <Notice>{error}</Notice>}
      <div className="stat-grid">
        <Stat
          label="Total forms"
          value={forms.length}
          icon={<FileText size={20} />}
          detail="A home for every conversation"
          tone="peach"
        />
        <Stat
          label="Total responses"
          value={total}
          icon={<Inbox size={20} />}
          detail="Every answer has a story"
          tone="sage"
        />
        <Stat
          label="Published forms"
          value={published}
          icon={<ArrowUpRight size={20} />}
          detail={published ? "Out there, ready to listen" : "Ready when you are"}
          tone="lavender"
        />
      </div>
      <section className="forms-section">
        <div className="section-toolbar">
          <div>
            <h2>
              Your forms <span className="count-chip">{forms.length}</span>
            </h2>
            <p>Little conversations. All in one place.</p>
          </div>
          <div className="form-view-toggle">
            <button
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={view === "grid" ? "selected" : ""}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={view === "list" ? "selected" : ""}
            >
              <List size={17} />
            </button>
          </div>
        </div>
        <div className="forms-controls">
          <div className="filter-tabs" aria-label="Filter forms">
            {["all", "published", "draft"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={filter === f ? "active" : ""}
              >
                {f === "all" ? "All forms" : f === "published" ? "Published" : "Drafts"}
              </button>
            ))}
          </div>
          <label className="search-box">
            <Search size={16} />
            <input
              placeholder="Find a form…"
              aria-label="Search forms"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className={`forms-grid ${view === "list" ? "forms-list" : ""}`}>
          {visible.map((form) => (
            <article className="form-card" key={form.id}>
              <div className="form-card-top">
                <span
                  className="form-card-icon"
                  style={{ background: `${form.settings.color}16`, color: form.settings.color }}
                >
                  <MessageCircle size={23} />
                </span>
                <span className={`status-badge ${form.published ? "published" : "draft"}`}>
                  <i />
                  {form.published ? "Published" : "Draft"}
                </span>
              </div>
              <Link href={`/builder/${form.id}`} className="form-card-title">
                <h3>{form.title}</h3>
              </Link>
              <p className="form-card-description">
                {form.description || "A new conversation in the making."}
              </p>
              <div className="form-card-meta">
                <span>
                  <List size={13} />
                  {form.questions.length} questions
                </span>
                <Link href={`/dashboard/forms/${form.id}`}>
                  <Inbox size={13} />
                  {form.response_count} responses
                  <ArrowRight size={12} />
                </Link>
              </div>
              <div className="form-card-bottom">
                <span>Edited {<Timestamp value={form.updated_at} />}</span>
                <div>
                  <button
                    className="icon-button"
                    aria-label={`Copy public link for ${form.title}`}
                    disabled={!form.published}
                    onClick={() => copy(form.id)}
                  >
                    {copied === form.id ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  <Link
                    className="icon-button"
                    aria-label={`Edit ${form.title}`}
                    href={`/builder/${form.id}`}
                  >
                    <Pencil size={15} />
                  </Link>
                  <button
                    className="icon-button delete-button"
                    aria-label={`Delete ${form.title}`}
                    onClick={() => {
                      setError("");
                      setDeleteTarget(form);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!search && filter === "all" && (
            <button className="new-form-card" onClick={() => setCreateOpen(true)}>
              <span>
                <Plus size={23} />
              </span>
              <strong>A fresh conversation</strong>
              <small>Start with a blank canvas</small>
            </button>
          )}
        </div>
        {!visible.length && (search || filter !== "all") && (
          <div className="empty-state">
            <Search size={28} />
            <h3>No forms found.</h3>
            <p>Try a different search or filter.</p>
            <button
              className="text-button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Show all forms
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>
      <section className="templates-section">
        <div className="section-toolbar">
          <div>
            <div className="eyebrow">SKIP THE BLANK PAGE</div>
            <h2>A little inspiration to get started.</h2>
          </div>
          <span className="template-note">
            <Sparkles size={15} />
            Make any template your own
          </span>
        </div>
        <div className="template-grid">
          {TEMPLATES.map((t, i) => (
            <button
              key={t.id}
              className={`template-card ${["peach", "sage", "lavender"][i]}`}
              onClick={() => create(t.id)}
              disabled={busy}
            >
              <span className="template-icon">
                {i === 0 ? (
                  <Heart size={21} />
                ) : i === 1 ? (
                  <MessageCircle size={21} />
                ) : (
                  <Sparkles size={21} />
                )}
              </span>
              <div>
                <h3>{t.title}</h3>
                <p>{t.description}</p>
                <span>{t.count} questions</span>
              </div>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
      </section>
      <div className="dashboard-footer">
        <span>Made for the people on both sides of the form.</span>
        <span>
          formly<span className="heading-dot">.</span>
        </span>
      </div>
      {createOpen && (
        <Modal
          title="Start a new conversation"
          onClose={() => {
            if (!busy) setCreateOpen(false);
          }}
        >
          <p className="modal-description">Start from scratch, or take a little inspiration.</p>
          {error && <Notice>{error}</Notice>}
          <button className="create-option" onClick={() => create()} disabled={busy}>
            <span className="create-option-icon">
              <Plus size={22} />
            </span>
            <div>
              <strong>Blank form</strong>
              <small>Your questions. Your way.</small>
            </div>
            <ArrowRight size={17} />
          </button>
          {TEMPLATES.map((t) => (
            <button
              className="create-option"
              key={t.id}
              onClick={() => create(t.id)}
              disabled={busy}
            >
              <span className="create-option-icon" style={{ color: t.color }}>
                <MessageCircle size={21} />
              </span>
              <div>
                <strong>{t.title}</strong>
                <small>{t.count} ready-to-edit questions</small>
              </div>
              <ArrowRight size={17} />
            </button>
          ))}
          {busy && (
            <p className="muted" role="status">
              Creating your form…
            </p>
          )}
        </Modal>
      )}
      {deleteTarget && (
        <Modal
          title="Delete this conversation?"
          onClose={() => {
            if (!busy) setDeleteTarget(null);
          }}
        >
          <p className="modal-description">
            “{deleteTarget.title}” and its {deleteTarget.response_count} saved responses will be
            permanently deleted. Its public link and widget will stop working.
          </p>
          {error && <Notice>{error}</Notice>}
          <div className="modal-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setDeleteTarget(null)}>
              Keep form
            </Button>
            <Button variant="danger" busy={busy} onClick={remove}>
              Delete form
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
  detail,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  detail: string;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div>
        <span>{label}</span>
        <span className={`stat-icon ${tone}`}>{icon}</span>
      </div>
      <strong>{value.toLocaleString()}</strong>
      <p>{detail}</p>
    </div>
  );
}

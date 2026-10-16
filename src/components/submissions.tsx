"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Download, Inbox, Search } from "lucide-react";
import type { FormRecord, Submission } from "@/lib/types";
import { formatDate } from "@/lib/client";
import { Modal, Timestamp } from "./ui";

export function Submissions({
  submissions,
  form,
}: {
  submissions: Submission[];
  form?: FormRecord;
}) {
  const [selected, setSelected] = useState<Submission | null>(null);
  const [search, setSearch] = useState("");
  const visible = submissions.filter((s) =>
    `${s.form_title} ${s.answers.map((a) => a.value).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  function exportCsv() {
    // Prefix spreadsheet formulas to avoid CSV formula injection.
    const quote = (s: string) =>
      `"${(/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
    const rows = [
      ["Submission ID", "Form", "Submitted at (UTC)", "Question", "Answer"],
      ...visible.flatMap((s) =>
        s.answers.map((a) => [
          s.id,
          s.form_title,
          new Date(s.created_at).toISOString(),
          a.label,
          a.value,
        ]),
      ),
    ];
    const blob = new Blob(["\uFEFF" + rows.map((r) => r.map(quote).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "formly-responses.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="dashboard-content">
      {form && (
        <Link className="back-link" href="/dashboard">
          <ArrowLeft size={14} />
          Back to my forms
        </Link>
      )}
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE OTHER SIDE OF THE CONVERSATION</div>
          <h1>
            {form ? form.title : "Every response. One place."}
            <span className="heading-dot">.</span>
          </h1>
          <p>
            {submissions.length} {submissions.length === 1 ? "response" : "responses"} · Every
            answer, saved with a little context.
          </p>
        </div>
        <div className="heading-actions">
          {form && (
            <Link href={`/builder/${form.id}`} className="button button-secondary">
              Edit form
              <ArrowRight size={15} />
            </Link>
          )}
          <button
            disabled={!visible.length}
            onClick={exportCsv}
            className="button button-secondary"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>
      <div className="responses-card">
        <div className="responses-toolbar">
          <h2>
            {form ? "Submissions" : "Your inbox"}
            <span className="count-chip">{visible.length}</span>
          </h2>
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label="Search responses"
              placeholder="Search responses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        {visible.length ? (
          <div className="table-scroll">
            <table className="responses-table">
              <thead>
                <tr>
                  <th>Conversation</th>
                  <th>First answer</th>
                  <th>Submitted</th>
                  <th>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s, i) => (
                  <tr key={s.id}>
                    <td>
                      <div className="response-form-name">
                        <span className="response-number">{String(i + 1).padStart(2, "0")}</span>
                        <strong>{s.form_title}</strong>
                      </div>
                    </td>
                    <td className="answer-cell">
                      {s.answers.find((a) => a.value)?.value || "No optional answers"}
                    </td>
                    <td className="date-cell">{<Timestamp value={s.created_at} includeTime />}</td>
                    <td>
                      <button onClick={() => setSelected(s)} className="text-button">
                        View answers
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <Inbox size={28} />
            </span>
            <h3>{search ? "No matching responses." : "Your next insight is on its way."}</h3>
            <p>
              {search
                ? "Try searching for something else."
                : "Share your published form. Every submitted answer will show up here."}
            </p>
            {!search && (
              <Link className="button button-secondary" href="/dashboard/embed">
                Share a form
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        )}
      </div>
      <p className="timestamps-note">
        Timestamps are shown in your local timezone. CSV exports use UTC.
      </p>
      {selected && (
        <Modal title="A closer look" onClose={() => setSelected(null)} wide>
          <div className="submission-summary">
            <h3>{selected.form_title}</h3>
            <p>
              {<Timestamp value={selected.created_at} includeTime />} · {selected.answers.length}{" "}
              answers
            </p>
            <small>Response ID: {selected.id}</small>
          </div>
          <dl className="answer-detail-list">
            {selected.answers.map((answer, i) => (
              <div key={answer.questionId}>
                <dt>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {answer.label}
                </dt>
                <dd>{answer.value || <em>Skipped (optional)</em>}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </main>
  );
}

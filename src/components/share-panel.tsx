"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Code2, Copy, Globe, Link2 } from "lucide-react";
import type { FormRecord } from "@/lib/types";
import { Notice } from "./ui";

export function SharePanel({ form }: { form: FormRecord }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  useEffect(() => setOrigin(location.origin), []);
  const link = `${origin}/f/${form.id}`;
  const snippet = `<script\n  src="${origin}/embed.js"\n  data-form="${form.id}"\n  defer\n></script>`;
  async function copy(value: string, type: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      setTimeout(() => setCopied(""), 2500);
    } catch {
      setError("Clipboard access isn't available. Select and copy the text below.");
    }
  }
  return (
    <div className="share-panel">
      {!form.published && (
        <Notice kind="info">Publish this form to activate its public link and widget.</Notice>
      )}
      {error && <Notice>{error}</Notice>}
      <div className="share-heading">
        <span>
          <Link2 size={19} />
        </span>
        <div>
          <h3>Send a little link.</h3>
          <p>Anyone with this link can answer your published form.</p>
        </div>
      </div>
      <div className="copy-input">
        <input
          aria-label="Public form URL"
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
        />
        <button aria-label="Copy public form link" onClick={() => copy(link, "link")}>
          {copied === "link" ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </div>
      {form.published && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-link">
          Open public form
          <ArrowUpRight size={15} />
        </a>
      )}
      <div className="share-divider" />
      <div className="share-heading">
        <span>
          <Code2 size={19} />
        </span>
        <div>
          <h3>Make it part of your website.</h3>
          <p>Paste this snippet before the closing &lt;/body&gt; tag.</p>
        </div>
      </div>
      <div className="code-block">
        <div>
          <span>HTML / JAVASCRIPT</span>
          <button onClick={() => copy(snippet, "code")}>
            {copied === "code" ? <Check size={14} /> : <Copy size={14} />}
            {copied === "code" ? "Copied" : "Copy code"}
          </button>
        </div>
        <pre tabIndex={0}>{snippet}</pre>
      </div>
      <p className="embed-explainer">
        The floating widget uses your published colors and welcome message. It works independently
        of your website's styles, on desktop and mobile.
      </p>
      <div className="share-test">
        <Globe size={20} />
        <div>
          <strong>See it on another website.</strong>
          <p>Test your widget on our standalone example site.</p>
        </div>
        <a
          href={`https://formly-widget-test.vercel.app/?form=${form.id}&host=${encodeURIComponent(origin)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="button button-secondary"
        >
          Test embed
          <ArrowUpRight size={14} />
        </a>
      </div>
    </div>
  );
}

export function EmbedGuide({ forms }: { forms: FormRecord[] }) {
  const [selected, setSelected] = useState(
    forms.find((f) => f.published)?.id ?? forms[0]?.id ?? "",
  );
  const form = forms.find((f) => f.id === selected);
  return (
    <main className="dashboard-content narrow-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">LET THE CONVERSATION TRAVEL</div>
          <h1>
            Share & embed<span className="heading-dot">.</span>
          </h1>
          <p>A link for anywhere. A little widget for your website.</p>
        </div>
      </div>
      {form ? (
        <>
          <label className="guide-select">
            Choose a form
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                  {f.published ? " · Published" : " · Draft"}
                </option>
              ))}
            </select>
          </label>
          <div className="guide-card">
            <SharePanel form={form} />
          </div>
          <Link href={`/builder/${form.id}`} className="text-link">
            Edit this form
            <ArrowUpRight size={14} />
          </Link>
        </>
      ) : (
        <div className="empty-state guide-card">
          <Code2 size={32} />
          <h3>First, a form. Then, everywhere.</h3>
          <p>Create your first form to get its link and embed code.</p>
          <Link href="/dashboard" className="button button-primary">
            Go to my forms
          </Link>
        </div>
      )}
    </main>
  );
}

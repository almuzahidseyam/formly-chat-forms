"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  Code2,
  LayoutDashboard,
  ListPlus,
  MessageCircle,
  MousePointer2,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { ChatForm } from "./chat-form";
import { Logo } from "./ui";
import { createDefinition } from "@/lib/templates";

const DEMO = createDefinition("feedback");
DEMO.title = "A little feedback";
DEMO.settings.welcome =
  "Hey there 👋 Thanks for stopping by. Mind if we ask you a few quick questions?";

export function Landing() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="landing">
      <nav className="landing-nav page-width">
        <Logo />
        <div className="landing-links">
          <a href="#features">Why Formly</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/demo">Explore workspace</Link>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-login">
            Log in
          </Link>
          <Link href="/signup" className="button button-dark">
            Start building
            <ArrowUp />
          </Link>
        </div>
      </nav>
      <main>
        <section className="hero page-width">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="little-spark">
                <Sparkles size={13} />
              </span>
              A BETTER WAY TO ASK
            </div>
            <h1>
              Less form.
              <br />
              More <span>conversation.</span>
            </h1>
            <p>
              Turn your questions into a friendly chat.
              <br className="desktop-break" /> Build a form, share it anywhere, and get to know
              <br className="desktop-break" /> the people on the other side.
            </p>
            <div className="hero-actions">
              <Link href="/signup" className="button button-primary button-large">
                Create your first form
                <ArrowRight size={18} />
              </Link>
              <a href="#demo" className="button button-ghost">
                <span className="play-circle">
                  <Play size={13} fill="currentColor" />
                </span>
                See it in action
              </a>
            </div>
            <div className="hero-assurances">
              <span>
                <Check size={14} />
                No code needed
              </span>
              <span>
                <Check size={14} />
                Made for real conversations
              </span>
            </div>
            <div className="hero-note">
              <span className="note-line" />
              <p>
                A little more human.
                <br />A lot less “please fill this out.”
              </p>
            </div>
          </div>
          <div className="hero-visual" id="demo">
            <div className="visual-grid" />
            <div className="demo-tag">
              <span className="online-dot" />
              LIVE DEMO — GIVE IT A TRY
              <ArrowDown size={13} />
            </div>
            <div className="hero-chat">
              <ChatForm form={DEMO} preview autoStart />
            </div>
            <div className="floating-note note-top">
              <span className="note-icon">
                <CheckCheck size={18} />
              </span>
              <div>
                <strong>One question at a time.</strong>
                <span>Feels like a conversation.</span>
              </div>
            </div>
            <div className="floating-note note-bottom">
              <MousePointer2 size={16} />
              <span>Go on, it's interactive!</span>
            </div>
            <span className="hero-asterisk">✳</span>
          </div>
        </section>
        <div className="value-strip">
          <div className="page-width">
            <span>Small forms. Meaningful connections.</span>
            <div>
              <span>Customer feedback</span>
              <i />
              <span>Contact forms</span>
              <i />
              <span>Product research</span>
              <i />
              <span>Lead capture</span>
            </div>
          </div>
        </div>
        <section className="features-section page-width" id="features">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THOUGHTFULLY SIMPLE</div>
              <h2>
                Everything you need.
                <br />
                <em>Room to keep it simple.</em>
              </h2>
            </div>
            <p>
              From your first question to your next insight,
              <br />a little less friction at every step.
            </p>
          </div>
          <div className="feature-grid">
            <Feature
              icon={<ListPlus size={22} />}
              number="01"
              title="Build in your own words"
              text="Add text, email, multiple choice, or yes/no questions. Arrange them into a conversation that feels like you."
              tone="peach"
            >
              <div className="mini-question">
                <span className="mini-letter">T</span>
                <span>What's your name?</span>
                <span className="mini-required">Required</span>
              </div>
              <div className="mini-question">
                <span className="mini-letter">@</span>
                <span>Your email address</span>
                <Check size={14} />
              </div>
            </Feature>
            <Feature
              icon={<Code2 size={22} />}
              number="02"
              title="At home on any website"
              text="Share a public link or add one small script to your site. Your floating chat widget takes care of the rest."
              tone="sage"
            >
              <div className="mini-code">
                <span>&lt;script</span> src="…/embed.js"
                <br />
                &nbsp;&nbsp;data-form="your-form-id"
                <br />
                <span>&gt;&lt;/script&gt;</span>
              </div>
            </Feature>
            <Feature
              icon={<LayoutDashboard size={22} />}
              number="03"
              title="Every response, together"
              text="See your submissions in one calm space, with every answer and its timestamp. Real feedback, ready when you are."
              tone="lavender"
            >
              <div className="mini-response">
                <span className="mini-avatar">J</span>
                <div>
                  <strong>“Loved how easy that was!”</strong>
                  <small>Customer feedback · Just now</small>
                </div>
                <span className="mini-status">
                  <Check size={12} />
                </span>
              </div>
            </Feature>
          </div>
        </section>
        <section className="how-section" id="how-it-works">
          <div className="page-width how-inner">
            <div>
              <div className="eyebrow">FROM HELLO TO INSIGHT</div>
              <h2>
                Good conversations
                <br />
                start with a question.
              </h2>
              <p>Three steps. That's the whole story.</p>
              <Link href="/signup" className="text-link">
                Let's build something
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="steps">
              {[
                {
                  title: "Make it yours",
                  text: "Write your questions. Pick a color. Add a warm welcome.",
                },
                {
                  title: "Put it out there",
                  text: "Publish your form and share a link or embed your widget.",
                },
                {
                  title: "Listen to what comes back",
                  text: "Find every response waiting for you in your dashboard.",
                },
              ].map((s, i) => (
                <div className="step" key={s.title}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="landing-cta page-width">
          <div className="cta-spark">✳</div>
          <div className="eyebrow">YOUR NEXT CONVERSATION STARTS HERE</div>
          <h2>
            Make room for a little
            <br />
            <em>more connection.</em>
          </h2>
          <Link href="/signup" className="button button-primary button-large">
            Build your first form
            <ArrowRight size={18} />
          </Link>
          <Link href="/demo" className="demo-workspace-link">
            Or explore a sample workspace
            <ArrowRight size={14} />
          </Link>
          <p>
            <ShieldCheck size={14} />
            Your forms. Your responses. One simple workspace.
          </p>
        </section>
      </main>
      <footer className="landing-footer page-width">
        <div>
          <Logo />
          <p>A friendlier way to fill things in.</p>
        </div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link href="/login">Dashboard</Link>
          <a href="https://github.com/almuzahidseyam">Contact</a>
        </div>
        <span>Built by Muhammad Al-Muzahid · 2026</span>
      </footer>
      <div className={`demo-floating ${demoOpen ? "is-open" : ""}`}>
        {demoOpen && (
          <div className="floating-chat-panel">
            <div className="floating-preview-label">
              LIVE PREVIEW{" "}
              <button aria-label="Close demo" onClick={() => setDemoOpen(false)}>
                <X size={15} />
              </button>
            </div>
            <ChatForm form={DEMO} preview />
          </div>
        )}
        <button
          className="widget-launcher"
          onClick={() => setDemoOpen((o) => !o)}
          aria-label={demoOpen ? "Close demo chatbot" : "Open demo chatbot"}
          aria-expanded={demoOpen}
        >
          {demoOpen ? <X size={23} /> : <MessageCircle size={24} />}
        </button>
        {!demoOpen && <span className="widget-hint">Meet your next form 👋</span>}
      </div>
    </div>
  );
}

function ArrowUp() {
  return <ArrowRight size={15} className="arrow-up" />;
}
function Feature({
  icon,
  number,
  title,
  text,
  tone,
  children,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  text: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`feature-card ${tone}`}>
      <div className="feature-top">
        <span>{icon}</span>
        <small>{number}</small>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="feature-illustration">{children}</div>
    </article>
  );
}

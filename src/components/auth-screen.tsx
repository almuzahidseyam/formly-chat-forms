"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, MessageCircle } from "lucide-react";
import { api } from "@/lib/client";
import { Button, Logo, Notice } from "./ui";

export function AuthScreen({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`/api/auth/${signup ? "signup" : "login"}`, "POST", data);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-story">
        <Logo />
        <div>
          <div className="eyebrow">A LITTLE MORE HUMAN</div>
          <h1>
            Better questions.
            <br />
            <em>Real connections.</em>
          </h1>
          <p>
            A simple home for your forms,
            <br />
            conversations, and everything you learn.
          </p>
          <div className="auth-bubbles">
            <span>
              <MessageCircle size={15} />
              What's on your mind?
            </span>
            <span>
              Glad you asked. <Check size={13} />
            </span>
          </div>
        </div>
        <small>Thoughtfully simple. From start to submit.</small>
      </div>
      <div className="auth-content">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} />
          Back to home
        </Link>
        <div className="auth-form-wrap">
          <div className="eyebrow">
            {signup ? "LET'S GET YOU STARTED" : "GOOD TO SEE YOU AGAIN"}
          </div>
          <h2>{signup ? "Make yourself at home." : "Welcome back."}</h2>
          <p>
            {signup
              ? "Your first conversation is just a few questions away."
              : "Your forms and responses are right where you left them."}
          </p>
          <form onSubmit={submit} className="auth-form">
            {error && <Notice>{error}</Notice>}
            {signup && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <div className="password-input">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                  minLength={10}
                  maxLength={128}
                  placeholder={signup ? "At least 10 characters" : "Enter your password"}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <Button type="submit" busy={busy}>
              {signup ? "Create your workspace" : "Sign in"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? "Already have an account?" : "New around here?"}{" "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <Link className="auth-demo-link" href="/demo">
            Just looking? Explore a sample workspace →
          </Link>
        </div>
      </div>
    </main>
  );
}

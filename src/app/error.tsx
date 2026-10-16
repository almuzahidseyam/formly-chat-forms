"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="unavailable-page">
      <h1>A little hiccup.</h1>
      <p>We couldn't load this page. Please try again in a moment.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
      <Link className="text-link" href="/">
        Back to home
      </Link>
    </main>
  );
}

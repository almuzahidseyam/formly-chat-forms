import Link from "next/link";
export default function NotFound() {
  return (
    <main className="unavailable-page">
      <h1>This page wandered off.</h1>
      <p>We couldn't find that page or form. Let's get you back home.</p>
      <Link href="/dashboard" className="button button-primary">
        Go to your workspace
      </Link>
      <Link href="/" className="text-link">
        Back to home
      </Link>
    </main>
  );
}

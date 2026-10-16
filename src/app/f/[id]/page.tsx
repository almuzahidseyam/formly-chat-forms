import { z } from "zod";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { publicForm } from "@/lib/forms";
import { HttpError } from "@/lib/http";
import { ChatForm } from "@/components/chat-form";
export const dynamic = "force-dynamic";
export const metadata = { title: "A little conversation", robots: { index: false, follow: false } };
export default async function PublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return <Unavailable />;
  try {
    const form = await publicForm(id);
    return (
      <main className="public-form-page">
        <div className="public-form-brand">
          <Link href="/">
            formly<span>.</span>
          </Link>
          <span>A LITTLE MORE HUMAN</span>
        </div>
        <div className="public-form-intro">
          <h1>{form.title}</h1>
          {form.description && <p>{form.description}</p>}
        </div>
        <div className="public-chat-wrap">
          <ChatForm form={form} />
        </div>
        <p className="public-privacy">Your answers are shared with this form's creator.</p>
      </main>
    );
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return <Unavailable />;
    throw e;
  }
}
function Unavailable() {
  return (
    <main className="unavailable-page">
      <span>
        <MessageCircle size={32} />
      </span>
      <h1>This conversation is taking a break.</h1>
      <p>
        The form isn't accepting responses right now.
        <br />
        Check back later or contact the person who shared it.
      </p>
      <Link href="/" className="button button-secondary">
        Visit Formly
      </Link>
    </main>
  );
}

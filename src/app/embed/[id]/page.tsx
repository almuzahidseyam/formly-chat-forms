import { z } from "zod";
import { publicForm } from "@/lib/forms";
import { HttpError } from "@/lib/http";
import { ChatForm } from "@/components/chat-form";
export const dynamic = "force-dynamic";
export const metadata = { title: "Chat widget", robots: { index: false, follow: false } };
export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (!z.uuid().safeParse(id).success) throw new HttpError(404, "Unavailable");
    const form = await publicForm(id);
    return (
      <main className="embedded-page">
        <ChatForm form={form} embedded />
      </main>
    );
  } catch (e) {
    if (e instanceof HttpError && e.status === 404)
      return (
        <main className="embed-unavailable">
          <h1>We'll be back soon.</h1>
          <p>This form isn't accepting responses right now.</p>
        </main>
      );
    throw e;
  }
}

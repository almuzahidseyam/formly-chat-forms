import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { ownedForm } from "@/lib/forms";
import { HttpError } from "@/lib/http";
import { query } from "@/lib/db";
import type { Submission } from "@/lib/types";
import { Submissions } from "@/components/submissions";
export const metadata = { title: "Form responses" };
export default async function FormResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  try {
    const form = await ownedForm(id, user.id);
    const submissions = await query(
      "SELECT * FROM submissions WHERE form_id=$1 ORDER BY created_at DESC",
      [id],
    );
    return <Submissions form={form} submissions={submissions as Submission[]} />;
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}

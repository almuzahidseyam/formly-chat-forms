import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Submission } from "@/lib/types";
import { Submissions } from "@/components/submissions";
export const metadata = { title: "All responses" };
export default async function ResponsesPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const submissions = await query(
    "SELECT s.* FROM submissions s JOIN forms f ON s.form_id=f.id WHERE f.owner_id=$1 ORDER BY s.created_at DESC",
    [user.id],
  );
  return <Submissions submissions={submissions as Submission[]} />;
}

import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { ownedForm } from "@/lib/forms";
import { HttpError } from "@/lib/http";
import { Builder } from "@/components/builder";
export const dynamic = "force-dynamic";
export const metadata = { title: "Form builder" };
export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  try {
    return <Builder initialForm={await ownedForm(id, user.id)} />;
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}

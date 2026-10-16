import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listForms } from "@/lib/forms";
import { EmbedGuide } from "@/components/share-panel";
export const metadata = { title: "Share & embed" };
export default async function EmbedPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <EmbedGuide forms={await listForms(user.id)} />;
}

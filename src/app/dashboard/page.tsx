import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listForms } from "@/lib/forms";
import { Dashboard } from "@/components/dashboard";
export const metadata = { title: "Your workspace" };
export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <Dashboard initialForms={await listForms(user.id)} name={user.name} />;
}

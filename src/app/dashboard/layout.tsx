import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/workspace-shell";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <WorkspaceShell user={user}>{children}</WorkspaceShell>;
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Code2, ExternalLink, FileText, Inbox, LogOut, Menu, MessageCircle, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { User } from "@/lib/types";
import { api } from "@/lib/client";
import { Logo } from "./ui";

export function WorkspaceShell({ user, children }: { user: User; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const links = [
    { href: "/dashboard", label: "My forms", icon: FileText },
    { href: "/dashboard/responses", label: "All responses", icon: Inbox },
    { href: "/dashboard/embed", label: "Share & embed", icon: Code2 },
  ];
  async function signOut() {
    try {
      await api("/api/auth/logout", "POST");
      router.push("/");
      router.refresh();
    } catch {
      setLogoutError("Couldn't sign out. Please try again.");
    }
  }
  return (
    <div className="workspace">
      <header className="mobile-workspace-bar">
        <Logo />
        <button
          className="icon-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Logo />
        <div className="workspace-name">
          <span className="workspace-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.name.split(" ")[0]}'s workspace</strong>
            <small>Personal workspace</small>
          </div>
        </div>
        <span className="sidebar-label">WORKSPACE</span>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={
                pathname === href ||
                (href === "/dashboard" && pathname.startsWith("/dashboard/forms/"))
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-tip">
          <span>
            <MessageCircle size={18} />
          </span>
          <strong>Start with a hello.</strong>
          <p>A warm welcome makes a world of difference.</p>
          <Link href="/dashboard/embed">
            Share your first form
            <ExternalLink size={12} />
          </Link>
        </div>
        <div className="sidebar-user">
          <span className="user-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user.name}</strong>
            <small>
              {user.email.endsWith("@demo.formly.local") ? "Isolated demo workspace" : user.email}
            </small>
          </div>
          <button onClick={signOut} className="icon-button" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
        {logoutError && (
          <p className="field-error" role="alert">
            {logoutError}
          </p>
        )}
      </aside>
      <div className="workspace-main">
        <div className="workspace-topbar">
          <span>
            Workspace <span>/</span>{" "}
            {pathname.includes("responses")
              ? "All responses"
              : pathname.includes("embed")
                ? "Share & embed"
                : pathname.includes("forms/")
                  ? "Form responses"
                  : "My forms"}
          </span>
          <Link href="/" target="_blank" rel="noopener">
            Visit home
            <ExternalLink size={13} />
          </Link>
        </div>
        {user.email.endsWith("@demo.formly.local") && (
          <div className="demo-workspace-banner">
            You're in your own demo workspace. Starter responses are examples. New responses are
            saved to PostgreSQL.{" "}
            <Link href="/signup">
              Create a lasting account
              <ExternalLink size={12} />
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

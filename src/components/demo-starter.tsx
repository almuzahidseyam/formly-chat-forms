"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { api } from "@/lib/client";
import { Button, Logo, Notice } from "./ui";

export function DemoStarter() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState("");
  async function start() {
    setError("");
    try {
      await api("/api/auth/demo", "POST", {});
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void start();
    }
  }, []);
  return (
    <main className="demo-loading">
      <Logo />
      <div>
        {error ? (
          <>
            <Notice>{error}</Notice>
            <Button onClick={start}>Try again</Button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" size={26} />
            <h1>Making a little room for you.</h1>
            <p>Setting up your own sample workspace…</p>
          </>
        )}
      </div>
    </main>
  );
}

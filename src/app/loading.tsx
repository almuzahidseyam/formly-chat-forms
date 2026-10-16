import { LoaderCircle } from "lucide-react";
export default function Loading() {
  return (
    <main className="demo-loading">
      <LoaderCircle size={26} className="spin" />
      <p role="status">Getting things ready…</p>
    </main>
  );
}

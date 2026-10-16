import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Formly — Less form. More conversation.", template: "%s · Formly" },
  description:
    "Build friendly conversational forms. Share a link, embed a chat widget, and keep every response in one simple workspace.",
  applicationName: "Formly",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}

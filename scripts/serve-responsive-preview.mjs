import { createServer } from "node:http";

// A narrow real iframe gives media queries a 390px viewport even when a desktop
// preview browser doesn't support device emulation. Only public routes are used.
createServer((request, response) => {
  const params = new URL(request.url, "http://127.0.0.1:3002").searchParams;
  const widget = params.get("widget") === "true";
  const source = widget
    ? "https://formly-chat-forms.vercel.app/embed/7d986199-4daa-461f-92ee-a00e34e161a0"
    : "https://formly-chat-forms.vercel.app/";
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Formly mobile layout check</title><style>body{margin:0;background:#e8ece1;display:flex;justify-content:center;padding:28px;font:12px Arial;color:#718461}.device{width:390px}p{margin:0 0 15px;text-align:center}iframe{width:390px;height:844px;border:1px solid #cbd5bf;background:white;border-radius:12px;display:block}</style></head><body><div class="device"><p>390 × 844 · ${widget ? "Public widget" : "Landing page"}</p><iframe src="${source}" title="Mobile responsive preview"></iframe></div></body></html>`,
  );
}).listen(3002, "127.0.0.1", () => console.log("Mobile layout check: http://127.0.0.1:3002"));

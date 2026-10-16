import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const html = await readFile(new URL("../examples/embed-host/index.html", import.meta.url));
createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}).listen(3001, "127.0.0.1", () => console.log("Independent embed example: http://127.0.0.1:3001"));

import { NextResponse } from "next/server";
import { z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError(415, "Send JSON data.");
  if (Number(request.headers.get("content-length") || 0) > 100_000)
    throw new HttpError(413, "This request is too large.");
  const raw = await request.text();
  if (raw.length > 100_000) throw new HttpError(413, "This request is too large.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "This request contains invalid JSON.");
  }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(request.url).origin]);
  const host = request.headers.get("host");
  if (host) allowed.add(`${new URL(request.url).protocol}//${host}`);
  if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
  if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);
  if (origin && !allowed.has(origin))
    throw new HttpError(403, "This request came from an untrusted origin.");
}

export function handleError(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json({ error: error.issues[0]?.message || "Check the submitted data." }, 400);
  // Never log connection strings, passwords, submitted answers or auth tokens.
  console.error("Formly request failed:", error instanceof Error ? error.name : "UnknownError");
  return json({ error: "Something went wrong. Please try again in a moment." }, 500);
}

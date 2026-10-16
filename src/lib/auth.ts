import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { query } from "./db";
import { HttpError } from "./http";
import type { User } from "./types";

const scrypt = promisify(scryptCallback);
export const COOKIE_NAME = "formly_session";
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function checkPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "hex");
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await query("DELETE FROM sessions WHERE expires_at < now()");
  await query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now() + interval '7 days')",
    [hash(token), userId],
  );
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.ALLOW_HTTP_COOKIES !== "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const rows = await query(
    "SELECT u.id,u.name,u.email FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()",
    [hash(token)],
  );
  return (rows[0] as User | undefined) ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  return user;
}

export async function logout() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await query("DELETE FROM sessions WHERE token_hash=$1", [hash(token)]);
  store.delete(COOKIE_NAME);
}

export async function rateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds = 900,
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = hash(`${scope}:${ip}:${bucket}`);
  await query("DELETE FROM rate_limits WHERE expires_at < now()");
  const rows = await query(
    "INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,now()+($2::text || ' seconds')::interval) ON CONFLICT(key) DO UPDATE SET count=rate_limits.count+1 RETURNING count",
    [key, windowSeconds],
  );
  if (Number(rows[0].count) > limit)
    throw new HttpError(429, "Too many attempts. Please wait a few minutes and try again.");
}

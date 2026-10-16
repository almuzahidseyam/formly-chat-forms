import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  currentUser,
  requireUser,
  hashPassword,
  checkPassword,
  createSession,
  logout,
  rateLimit,
} from "@/lib/auth";
import { query } from "@/lib/db";
import { checkOrigin, handleError, HttpError, json, readJson } from "@/lib/http";
import { credentialsSchema, signupSchema } from "@/lib/validation";
import {
  createForm,
  listForms,
  ownedForm,
  publicForm,
  publishForm,
  saveForm,
  submitForm,
} from "@/lib/forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };

async function handler(request: Request, context: Context) {
  try {
    const { path } = await context.params;
    const [resource, id, action] = path;
    if (path.length > 3) throw new HttpError(404, "Endpoint not found.");
    const method = request.method;
    if (!["GET", "HEAD"].includes(method)) checkOrigin(request);
    if (resource === "health" && method === "GET") {
      await query("SELECT 1");
      return json({ status: "ok", database: "postgresql" });
    }
    if (resource === "auth") {
      if (id === "demo" && method === "POST") {
        await rateLimit(request, "demo", 10, 3600);
        const user = {
          id: randomUUID(),
          name: "Demo explorer",
          email: `${randomUUID()}@demo.formly.local`,
        };
        await query("INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)", [
          user.id,
          user.name,
          user.email,
          await hashPassword(randomUUID()),
        ]);
        const feedback = await createForm(user.id, "feedback");
        await publishForm(feedback.id, user.id, feedback.draft_revision);
        await createForm(user.id, "contact");
        await createForm(user.id, "research");
        for (const [name, rating, note] of [
          ["Alex (example)", "Loved it", "The little details made it feel personal."],
          ["Jordan (example)", "Pretty good", "I'd love a few more color choices."],
          ["Sam (example)", "Loved it", "Quick, clear, and a pleasure to use."],
        ]) {
          const answers = feedback.questions.map((q, i) => ({
            questionId: q.id,
            label: q.label,
            type: q.type,
            value: [name, rating, note, "example@example.com"][i],
          }));
          await query(
            "INSERT INTO submissions(id,form_id,form_title,answers) VALUES($1,$2,$3,$4::jsonb)",
            [randomUUID(), feedback.id, feedback.title, JSON.stringify(answers)],
          );
        }
        await createSession(user.id);
        return json({ user }, 201);
      }
      if (id === "me" && method === "GET") return json({ user: await currentUser() });
      if (id === "logout" && method === "POST") {
        await logout();
        return json({ ok: true });
      }
      if (["signup", "login"].includes(id) && method === "POST") {
        await rateLimit(request, "auth", 25);
        if (id === "signup") {
          const data = signupSchema.parse(await readJson(request));
          const user = { id: randomUUID(), name: data.name, email: data.email };
          const rows = await query(
            "INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id",
            [user.id, user.name, user.email, await hashPassword(data.password)],
          );
          if (!rows.length)
            throw new HttpError(409, "An account with this email already exists. Try signing in.");
          await createSession(user.id);
          return json({ user }, 201);
        }
        const data = credentialsSchema.parse(await readJson(request));
        const rows = await query("SELECT * FROM users WHERE email=$1", [data.email]);
        // Equalize expensive password work for unknown emails to reduce enumeration timing.
        const stored = rows[0]?.password_hash as string | undefined;
        const valid = await checkPassword(
          data.password,
          stored ?? "00000000000000000000000000000000:" + "0".repeat(128),
        );
        if (!stored || !valid) throw new HttpError(401, "The email or password is incorrect.");
        await createSession(rows[0].id as string);
        return json({ user: { id: rows[0].id, name: rows[0].name, email: rows[0].email } });
      }
    }
    if (resource === "public" && id) {
      if (!z.uuid().safeParse(id).success) throw new HttpError(404, "This form couldn't be found.");
      if (method === "GET" && !action) {
        const response = json({ form: await publicForm(id) });
        response.headers.set("Access-Control-Allow-Origin", "*");
        return response;
      }
      if (method === "POST" && action === "submissions") {
        await rateLimit(request, `submission:${id}`, 60, 60);
        return json(await submitForm(id, await readJson(request)), 201);
      }
    }
    if (resource === "forms") {
      const user = await requireUser();
      if (!id) {
        if (method === "GET") return json({ forms: await listForms(user.id) });
        if (method === "POST") {
          const body = z
            .object({ template: z.enum(["feedback", "contact", "research"]).optional() })
            .parse(await readJson(request));
          return json({ form: await createForm(user.id, body.template) }, 201);
        }
      }
      if (!z.uuid().safeParse(id).success) throw new HttpError(404, "This form couldn't be found.");
      if (!action) {
        if (method === "GET") return json({ form: await ownedForm(id, user.id) });
        if (method === "PUT")
          return json({ form: await saveForm(id, user.id, await readJson(request)) });
        if (method === "DELETE") {
          await ownedForm(id, user.id);
          await query("DELETE FROM forms WHERE id=$1 AND owner_id=$2", [id, user.id]);
          return json({ ok: true });
        }
      }
      if (action === "publish" && method === "POST") {
        const body = z.object({ draft_revision: z.uuid() }).parse(await readJson(request));
        return json({ form: await publishForm(id, user.id, body.draft_revision) });
      }
      if (action === "unpublish" && method === "POST") {
        await ownedForm(id, user.id);
        await query(
          "UPDATE forms SET published=NULL,published_revision=NULL,updated_at=now() WHERE id=$1 AND owner_id=$2",
          [id, user.id],
        );
        return json({ form: await ownedForm(id, user.id) });
      }
      if (action === "submissions" && method === "GET") {
        await ownedForm(id, user.id);
        return json({
          submissions: await query(
            "SELECT * FROM submissions WHERE form_id=$1 ORDER BY created_at DESC",
            [id],
          ),
        });
      }
    }
    throw new HttpError(404, "Endpoint not found.");
  } catch (error) {
    return handleError(error);
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };

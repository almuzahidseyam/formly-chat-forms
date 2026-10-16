import { randomUUID } from "node:crypto";
import { query } from "./db";
import { HttpError } from "./http";
import { createDefinition } from "./templates";
import { formSchema, publishErrors, submissionSchema, validateAnswers } from "./validation";
import type { FormDefinition, FormRecord, PublicForm, SavedAnswer } from "./types";

export type StoredForm = FormRecord & { owner_id: string; draft_revision: string };

export async function listForms(owner: string) {
  return query(
    "SELECT f.*, (SELECT count(*)::integer FROM submissions s WHERE s.form_id=f.id) AS response_count FROM forms f WHERE owner_id=$1 ORDER BY updated_at DESC",
    [owner],
  ) as unknown as Promise<StoredForm[]>;
}

export async function ownedForm(id: string, owner: string): Promise<StoredForm> {
  const rows = await query(
    "SELECT f.*, (SELECT count(*)::integer FROM submissions s WHERE s.form_id=f.id) AS response_count FROM forms f WHERE f.id=$1 AND f.owner_id=$2",
    [id, owner],
  );
  if (!rows[0]) throw new HttpError(404, "This form couldn't be found.");
  return rows[0] as StoredForm;
}

export async function createForm(owner: string, template?: string) {
  const id = randomUUID();
  const form = createDefinition(template);
  await query(
    "INSERT INTO forms(id,owner_id,title,description,questions,settings,draft_revision) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)",
    [
      id,
      owner,
      form.title,
      form.description,
      JSON.stringify(form.questions),
      JSON.stringify(form.settings),
      randomUUID(),
    ],
  );
  return ownedForm(id, owner);
}

export async function saveForm(id: string, owner: string, input: unknown) {
  const previous = await ownedForm(id, owner);
  const form = formSchema.parse(input);
  const expected = (input as { draft_revision?: string }).draft_revision;
  if (!expected || expected !== previous.draft_revision)
    throw new HttpError(409, "This form changed in another tab. Reload before saving.");
  const rows = await query(
    "UPDATE forms SET title=$1,description=$2,questions=$3::jsonb,settings=$4::jsonb,draft_revision=$5,updated_at=now() WHERE id=$6 AND owner_id=$7 AND draft_revision=$8 RETURNING id",
    [
      form.title,
      form.description,
      JSON.stringify(form.questions),
      JSON.stringify(form.settings),
      randomUUID(),
      id,
      owner,
      expected,
    ],
  );
  if (!rows.length)
    throw new HttpError(409, "This form changed in another tab. Reload before saving.");
  return ownedForm(id, owner);
}

export async function publishForm(id: string, owner: string, expectedRevision: string) {
  const stored = await ownedForm(id, owner);
  if (stored.draft_revision !== expectedRevision)
    throw new HttpError(409, "Your draft has changed. Save it again before publishing.");
  const definition: FormDefinition = formSchema.parse(stored);
  const errors = publishErrors(definition);
  if (errors.length) throw new HttpError(400, errors[0]);
  const rows = await query(
    "UPDATE forms SET published=$1::jsonb,published_revision=$2,updated_at=now() WHERE id=$3 AND owner_id=$4 AND draft_revision=$5 RETURNING id",
    [JSON.stringify(definition), randomUUID(), id, owner, expectedRevision],
  );
  if (!rows.length)
    throw new HttpError(409, "Your draft changed while publishing. Please try again.");
  return ownedForm(id, owner);
}

export async function publicForm(id: string): Promise<PublicForm> {
  const rows = await query(
    "SELECT id,published,published_revision FROM forms WHERE id=$1 AND published IS NOT NULL",
    [id],
  );
  if (!rows[0]) throw new HttpError(404, "This form isn't accepting responses right now.");
  return {
    ...(rows[0].published as FormDefinition),
    id,
    revision: rows[0].published_revision as string,
  };
}

export async function submitForm(id: string, input: unknown) {
  const data = submissionSchema.parse(input);
  if (data.website) throw new HttpError(400, "We couldn't accept this response.");
  const form = await publicForm(id);
  if (data.revision !== form.revision)
    throw new HttpError(409, "This form was updated. Reload it to see the latest questions.");
  const error = validateAnswers(form.questions, data.answers);
  if (error) throw new HttpError(400, error);
  const answers: SavedAnswer[] = form.questions.map((q) => ({
    questionId: q.id,
    label: q.label,
    type: q.type,
    value: data.answers.find((a) => a.questionId === q.id)?.value.trim() ?? "",
  }));
  // Insert is guarded by the live revision, so an unpublish/republish race can't accept stale answers.
  const rows = await query(
    "INSERT INTO submissions(id,form_id,form_title,answers) SELECT $1,id,$2,$3::jsonb FROM forms WHERE id=$4 AND published IS NOT NULL AND published_revision=$5 ON CONFLICT(id) DO NOTHING RETURNING id",
    [data.submissionId, form.title, JSON.stringify(answers), id, data.revision],
  );
  if (!rows.length) {
    const existing = await query(
      "SELECT id FROM submissions WHERE id=$1 AND form_id=$2 AND answers=$3::jsonb",
      [data.submissionId, id, JSON.stringify(answers)],
    );
    if (!existing.length)
      throw new HttpError(
        409,
        "This form changed or this response ID was already used. Reload and try again.",
      );
  }
  return { id: data.submissionId, message: form.settings.completion };
}

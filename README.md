# Formly

**Less form. More conversation.** A full-stack form builder that turns questions into an embeddable chat widget and saves every submission to PostgreSQL.

Built for the **Tynoc Software Engineer Intern** assignment: _Build an Interactive Form Builder with Chatbot Widget_.

![Formly deployed landing page](docs/screenshots/landing-desktop.jpg)

- **Live application:** https://formly-chat-forms.vercel.app
- **Explore without signing up:** https://formly-chat-forms.vercel.app/demo
- **Independent embed test website:** https://formly-widget-test.vercel.app
- **Source:** https://github.com/almuzahidseyam/formly-chat-forms

## Try the complete workflow

1. Open **Explore workspace**, or create an account with your own email and a password of at least 10 characters.
2. Create a blank form or choose a starter template. Add text, email, multiple-choice and yes/no questions.
3. Change question order with drag-and-drop or the keyboard-accessible arrow controls. Configure required questions and the widget's color, welcome, start button and completion message.
4. Try the live preview. Preview responses are never saved.
5. **Save draft**, then **Publish form**. Copy the public URL or JavaScript snippet.
6. Select **Test embed** in the share dialog. This opens a **separate Vercel website** with your form embedded from the application origin.
7. Complete the chat and select **Send response**. Return to **Responses** to see the answers and timestamp. Export a CSV if needed.
8. **Style → Unpublish form** stops new responses on both the public page and the widget while preserving existing submissions.

The demo creates an isolated workspace per visitor, with three templates and clearly labeled example responses. Your own test submissions are genuinely stored in PostgreSQL. Demo sessions expire after seven days and cannot be recovered after signing out; use a real account for work you want to return to.

## Assignment coverage

| Requirement               | Implementation                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Responsive landing page   | Hero, features, workflow, interactive chat demo, footer/navigation/contact                  |
| User dashboard            | Real totals, searchable forms, status filters, grid/list views, CRUD, submissions           |
| Form builder              | Four question types, edit, duplicate, reorder, delete, required toggle, interactive preview |
| Chatbot widget            | Sequential questions, text/email inputs, answer buttons, validation, welcome/completion     |
| Customization             | Accent color, welcome message, start button text and completion message                     |
| Website embedding         | Dependency-free JavaScript loader, Shadow DOM container and isolated iframe                 |
| Public URLs               | Unique UUID-based public links for published forms                                          |
| Database-backed responses | PostgreSQL JSONB snapshots and submission timestamps                                        |
| Publishing controls       | Drafts, publish/republish, unpublish; draft edits do not change the live form               |
| Code and setup            | TypeScript, reusable components, setup instructions, automated checks, CI                   |
| Deployment                | Next.js on Vercel, separate Neon PostgreSQL database, independent embed test site           |

No generative AI, payments, subscriptions or advanced integrations are used.

![Mobile landing page](docs/screenshots/landing-mobile.jpg)

## Stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript
- **UI:** Tailwind CSS 4, shared CSS design tokens, Lucide icons
- **Backend:** Next.js Route Handlers on the Node.js runtime
- **Production database:** PostgreSQL on Neon, connected through `postgres.js`
- **Credential-free local database:** PGlite, an embedded PostgreSQL engine, persisted on disk
- **Validation:** Shared Zod schemas plus server-side answer validation
- **Authentication:** Salted scrypt password hashes, random server-side sessions, HttpOnly cookies
- **Hosting/version control:** Vercel and GitHub

## Local setup

**Prerequisite:** Node.js 22.9+; Node.js 24 is used in CI and deployment.

```sh
git clone https://github.com/almuzahidseyam/formly-chat-forms.git
cd formly-chat-forms
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. No API keys, Docker or hosted database are required for this local path. PGlite creates a real, persistent PostgreSQL database under `.data/formly`; it is not an in-memory mock or browser localStorage. The directory is ignored by Git.

### Use a PostgreSQL server or Supabase

Copy `.env.example` to `.env.local` and set:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
APP_URL=http://127.0.0.1:3000
```

For Supabase, use the **Session pooler connection string** shown under **Connect**, with your project database password. For Neon, use the pooled connection string from its dashboard. Keep credentials on the server; never prefix `DATABASE_URL` with `NEXT_PUBLIC_`.

Schema initialization runs once per server process, protected by a PostgreSQL advisory transaction lock across serverless instances. You can also initialize explicitly:

```sh
npm run db:migrate
```

For conventional local PostgreSQL, an optional Docker Compose file is included:

```sh
docker compose up -d
```

Set `DATABASE_URL=postgresql://formly:local-formly-only@127.0.0.1:5432/formly` and restart the app.

### Test embedding on another origin

With the application running:

```sh
node scripts/serve-embed-example.mjs
```

Create and publish a form, then open:

```text
http://127.0.0.1:3001/?form=YOUR_FORM_UUID&host=http%3A%2F%2F127.0.0.1%3A3000
```

Port 3001 serves plain HTML and loads the widget from port 3000. This proves that embedding is independent of the Next.js application and its styles.

The snippet for any website is:

```html
<script
  src="https://formly-chat-forms.vercel.app/embed.js"
  data-form="YOUR_FORM_UUID"
  defer
></script>
```

Use the application's deployed HTTPS origin when embedding on an HTTPS site. The widget does not require third-party cookies or the respondent to sign in.

## Validation and testing

```sh
npm run typecheck
npm test
npm run build
```

`npm test` covers the answer and publication rules, schema limits, reserved demo identity, template isolation, theme contrast selection, JSONB snapshot comparisons, and local PostgreSQL persistence across connection restarts.

With a development server running:

```sh
npm run test:integration
```

To exercise the production build with its own test server:

```sh
node scripts/run-integration.mjs
```

For an already deployed instance, set `TEST_BASE_URL` to its HTTPS origin before running the integration tests. The suite creates randomly named QA accounts and removes its test form at the end. Use a staging database for repeated development testing.

The integration workflow checks authentication, separate account ownership, cross-origin mutation rejection, all question types, required/email/choice validation, incomplete publication rejection, optimistic edit conflicts, public access, idempotent response retries, saved question snapshots, stale publication revisions, unpublish behavior, cascading form deletion, sign-in and session revocation.

GitHub Actions runs type checking, domain/storage tests, the production build and the full API workflow against a fresh PostgreSQL 17 service.

## Architecture

```text
Landing / Dashboard / Builder       External website
            │                              │
       React + Next.js                 embed.js
            │                       Shadow DOM launcher
      Route Handlers                  isolated iframe
            │                              │
      owner session checks       public form + submit API
            └──────────────┬───────────────┘
                    shared validation
                           │
                 PostgreSQL repository
              users · sessions · forms · submissions
```

See [Architecture and decisions](docs/ARCHITECTURE.md), [reviewer demo steps](docs/REVIEWER_GUIDE.md), and [বাংলায় interview প্রস্তুতি](docs/INTERVIEW_GUIDE.bn.md).

### Data integrity and security details

- Every owner query includes the authenticated `owner_id`. Private forms and responses are unavailable to other accounts.
- Passwords use a random 16-byte salt and scrypt. Session tokens are random 32-byte values; only their SHA-256 hashes are stored in the database.
- Cookies are HttpOnly, SameSite=Lax and Secure in production. Logout deletes the server-side session.
- Mutating requests check the browser origin. JSON endpoints reject oversized or non-JSON request bodies.
- PostgreSQL queries are parameterized. React renders user text safely; the embed loader creates DOM elements rather than interpolating user content into HTML.
- Public submission validation runs on the server even if client validation is bypassed. Rate limits and a honeypot provide basic spam protection.
- Publishing stores a snapshot with a unique revision. A draft can change without breaking a live conversation. Stale submissions receive a clear refresh message.
- Submissions save question labels and values together. Later edits do not rewrite historical answers.
- A client-generated submission UUID prevents duplicate rows when a successful request is retried.
- CSV exports prefix spreadsheet formula characters. Admin/auth pages refuse framing; public widget pages intentionally allow it.
- Credentials, `.env` files, local databases and deployment metadata are excluded from Git and upload archives.

## Deploy your own instance

1. Fork the repository and import it into Vercel as **Next.js**.
2. Create a separate PostgreSQL database on Neon or Supabase.
3. Set `DATABASE_URL` and `APP_URL` in Vercel. `APP_URL` must match your final HTTPS application origin.
4. Deploy. The schema initializes when the application first needs the database.
5. For a second-origin test site, deploy `examples/embed-host` as a static project. Update its default application origin and the test-site URL in `src/components/share-panel.tsx` if you use different domains.

Hosted deployments fail clearly without `DATABASE_URL`; they never silently save data to ephemeral serverless disk. PGlite is intended for local development or a single process with persistent disk. Use a PostgreSQL server for shared/serverless hosting.

## MVP boundaries

This assignment focuses on the complete create → publish → embed → submit → review flow. Password reset, email verification, teams, conditional branching, file uploads and production-grade abuse prevention are future work. Forms are limited to 30 questions, choice questions to 10 options, and text answers to 2,000 characters. The demo workspace is for evaluation rather than durable account recovery.

## Author and license

**Muhammad Al-Muzahid** · [GitHub](https://github.com/almuzahidseyam)

MIT licensed. See [LICENSE](LICENSE).

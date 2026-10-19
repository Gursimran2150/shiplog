<div align="center">

<img src="src/app/apple-icon.png" width="72" alt="ShipLog logo" />

# ShipLog

**Talk about your day. Ship your standup.**

A voice-first work journal for software engineers. Speak for 30 seconds with Wispr Flow (Hinglish welcome), and ShipLog turns it into a clean daily log, checks it against your GitHub and Bitbucket activity, follows every task from start to shipped as a **journey**, and writes your **standup**, **weekly report** and **appraisal brag doc**.

[**Open the live app →**](https://shiplog-voice.vercel.app) · [Demo video](https://VIDEO-LINK) · [How to use](#-how-to-use-shiplog) · [Connect your repos](#-connect-github--bitbucket) · [Is it safe?](#-safety--privacy)

<img src="docs/media/log-your-day.gif" width="880" alt="Dictating a Hinglish end-of-day note, then ShipLog structuring it into Done, In progress, Blockers and Tomorrow" />

</div>

---

## Contents

- [Who it's for](#-who-its-for)
- [How it works in 60 seconds](#-how-it-works-in-60-seconds)
- [Try it now](#-try-it-now-no-sign-up)
- [How to use ShipLog](#-how-to-use-shiplog)
- [Connect GitHub & Bitbucket](#-connect-github--bitbucket)
- [How tracking works](#-how-tracking-works)
- [Safety & privacy](#-safety--privacy)
- [Where we use GenAI](#-where-we-use-genai)
- [How Wispr Flow was used](#-how-wispr-flow-was-used)
- [Architecture & engineering](#-architecture--engineering)
- [Run it yourself](#-run-it-yourself)

---

## 👩‍💻 Who it's for

**Software engineers who have to report on their own work**: an async standup in Slack or Teams every morning, a weekly update for a manager, and a list of achievements every appraisal cycle.

The problem: writing those updates is slow and boring, so they come out vague ("worked on dashboard"), and six months of real impact is forgotten by review time. **Talking** about your day takes 30 seconds. ShipLog makes the spoken version the source of truth, and fills the gaps from the commits and pull requests you actually pushed.

It's built for one person's own workflow: frontend, backend or full-stack engineers, at a company (private GitHub or Bitbucket repos) or on personal projects (public GitHub).

## ⚡ How it works in 60 seconds

| 1. Speak                                                                                    | 2. Review                                                                                                                                       | 3. Ship                                                                          |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Hold your Wispr Flow key and ramble about your day, in English or Hinglish, pauses and all. | AI splits it into **Done / In progress / Blockers / Tomorrow**, links each item to its task's journey, and flags commits you forgot to mention. | One click for a Slack standup, a weekly report or a brag doc. Copy, paste, done. |

## 🚀 Try it now (no sign-up)

| Option                         | How                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One-tap demo** (recommended) | Open **[shiplog-voice.vercel.app](https://shiplog-voice.vercel.app)** and click **"Try the demo"**, then pick **"Account with mock data"** (about 18 months of realistic work logs, so the timeline, reports and search work right away) or **"Fresh empty account"** (start blank and log your own day). Both are private. |
| **Shared demo login**          | `demo@shiplog.dev` / `shiplog-demo-2026` (same sample journal, shared by everyone who uses it)                                                                                                                                                                                                                              |
| **Your own account**           | Click **"New here? Create an account"**.                                                                                                                                                                                                                                                                                    |

<p align="center"><img src="docs/screenshots/landing.png" width="880" alt="ShipLog landing and login page" /></p>

<p align="center"><img src="docs/screenshots/demo-chooser.png" width="760" alt="Try the demo: choose an account with mock data or a fresh empty account" /></p>

### What's in the mock-data account

A fictional frontend engineer's journal: **~340 working days over 18 months**, one log a day, written the way people actually talk (Hinglish). They work through 16 projects (design system, auth, checkout, dashboard, performance, billing, i18n, editor…), with code reviews, on-call, interviews and production bugs in between. Blockers come up and get resolved ("waiting on Rahul for the usage API"), each project ends with a measurable result ("conversion up 9%"), and there are weekends, holidays, a week of leave and the odd forgotten day. Each project task is tracked as a **journey** (with "how it was fixed" notes and learnings on the blocked ones), and there's already a **log for today**, so the Today page opens with your day structured. The heatmap, streaks, journeys, weekly reports, 6-month brag doc and Ask all have real history to work from. Every report and answer is still a live AI call.

---

## 📖 How to use ShipLog

### Step 1: The welcome tour (first login)

A five-step tour explains ShipLog and sets up your account: your Wispr Flow shortcut, your GitHub username, and your preferred standup format. Every step has **Skip tour**, and you can replay it any time from the avatar menu or `⌘K`.

<p align="center"><img src="docs/media/onboarding.gif" width="760" alt="The five-step welcome tour" /></p>

### Step 2: Log your day (Today)

At the end of your day, open **Today**, click the big box, hold your Wispr Flow key (Mac: `fn`, Windows: `Ctrl + Win`) and talk:

> _"aaj checkout page ka Safari wala crash fix kiya aur PR raise kar diya. Dashboard ke usage charts pe kaam chal raha hai, 80 percent ho gaya. Backend ka usage API abhi ready nahi hai, Rahul se baat karni hai. Kal onboarding flow ka redesign shuru karna hai."_

Not sure what to say? Tap the hints under the box (_What you finished · What's in progress · Anything blocking · Plan for tomorrow_). Then press **Structure my day** (or `⌘/Ctrl + Enter`).

<p align="center"><img src="docs/screenshots/today-dictated.png" width="880" alt="Today page with a dictated Hinglish note" /></p>

### Step 3: Review the structured log

ShipLog writes clean English in four sections, keeping your project names and numbers. Anything off? **Edit ✏️, remove ✕ or "+ Add item"**. Changes save automatically.

- **Journey / Move** on every item: ShipLog links each piece of work to the task it continues (the blocker on Tuesday and the fix on Friday are one task). **Journey** opens that task's history; **Move** fixes a wrong link, starts a new task, or marks it as routine work.
- **A few quick questions:** if a blocker or item is vague, ShipLog asks up to 3 follow-ups (who are you waiting on? since when?). Answer by voice and it updates the log.
- **Missed from GitHub** lists commits and PRs you pushed today but didn't mention. **Add to Done** puts them in your log.
- **Create ticket** on any blocker or to-do drafts a GitHub issue with acceptance criteria, which you can open pre-filled on GitHub.
- **Today on GitHub** (right) shows your activity across connected repos.

<p align="center"><img src="docs/screenshots/today-structured.png" width="880" alt="Structured log with Done, In progress, Blockers, Tomorrow and Missed from GitHub" /></p>

### Step 4: Generate your updates (Reports)

| When           | Tab               | What you get                                                                                                                                        |
| -------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every morning  | **Standup**       | Yesterday / Today / Blockers, formatted for Slack, Teams or plain text. Click **Copy** and paste.                                                   |
| Every Friday   | **Weekly report** | Highlights, Shipped, In progress, Blockers & risks, Next week, for your manager. Pick any past week from the calendar (days you logged are marked). |
| Appraisal time | **Brag doc**      | Your work over 30 days, a quarter or 6 months, grouped by project, with impact. **Download .md**.                                                   |

Reopen a report on unchanged logs and it comes back instantly as **"Saved report"**, with no new AI call.

<p align="center"><img src="docs/media/reports.gif" width="760" alt="Generating a standup, picking last week from the calendar for a weekly report, and a brag doc" /></p>

<table>
<tr>
<td><img src="docs/screenshots/reports-standup.png" alt="Slack-formatted standup" /></td>
<td><img src="docs/screenshots/reports-weekly.png" alt="Weekly report for last week" /></td>
</tr>
<tr>
<td><img src="docs/screenshots/reports-week-picker.png" alt="Week picker calendar with logged days marked and shortcuts for recent weeks" /></td>
<td><img src="docs/screenshots/reports-brag.png" alt="Six-month brag doc grouped by project, with impact" /></td>
</tr>
</table>

### Step 5: Follow a task from start to shipped (Journeys)

**Journeys** shows every task as a tree, **project → tasks**, each with its status (planned, in progress, blocked, done). Pick one to see how it went, day by day: **Started → In progress → Blocked (on whom) → Unblocked → Milestone → Done**, with how long it took and how many days it was blocked. Below that, keep **notes**: _How it was fixed_, _Learning_ or a plain _Note_. You can dictate them too.

- Open it from the **Journeys** tab, from **Journey** on any log item (Today and Timeline), from **Task journeys** after you log, or with **⌘K → "Open task journeys"**.
- ShipLog's AI links new log items to your open tasks as you log, even when you word things differently. Wrong link? Use **Move**.
- Search and filter (Open / Blocked / Done) to find, say, every blocker you hit this quarter and how each one got fixed.

<p align="center"><img src="docs/media/journeys.gif" width="880" alt="From Today's log to a task's journey: the timeline, searching tasks, saving a learning, and moving an item to another task" /></p>

<p align="center"><img src="docs/screenshots/journeys.png" width="880" alt="Journeys: project tree on the left; the usage API task's timeline (blocked, milestone, done) and its notes on the right" /></p>

<table>
<tr>
<td><img src="docs/screenshots/today-journey-links.png" alt="Today: every item has Journey and Move" /></td>
<td><img src="docs/screenshots/journeys-notes.png" alt="Notes on a task: how it was fixed and learnings" /></td>
<td><img src="docs/screenshots/journeys-move.png" alt="Move an item to another task, start a new one, or mark it routine" /></td>
</tr>
<tr>
<td align="center"><sub>Journey &amp; Move on every log item</sub></td>
<td align="center"><sub>How it was fixed, learnings</sub></td>
<td align="center"><sub>Fix a wrong link in two clicks</sub></td>
</tr>
</table>

### Step 6: Look back (Timeline & Ask)

- **Timeline:** a contribution heatmap of the last 12 months, with your streak, items shipped and top project. Click a day (or use the arrow keys) to see that week.
- **Ask your journal:** _"When did I last work on onboarding?"_ or _"What blockers did I have this month?"_. Answers come only from your own entries, with dates.

<table>
<tr>
<td><img src="docs/screenshots/timeline.png" alt="Timeline heatmap and week view" /></td>
<td><img src="docs/screenshots/ask.png" alt="Ask your journal answering with dates" /></td>
</tr>
</table>

### Step 7: Move fast

- `⌘K` / `Ctrl K` opens the command menu: jump anywhere, generate reports, switch theme, replay the tour.
- `?` lists every keyboard shortcut.
- Light, dark or system theme, and a full mobile layout.

<table>
<tr>
<td><img src="docs/screenshots/command-menu.png" alt="Command menu" /></td>
<td><img src="docs/screenshots/timeline-dark.png" alt="Dark mode" /></td>
</tr>
</table>

<p align="center">
<img src="docs/screenshots/mobile-tour.png" width="250" alt="Mobile: welcome tour" />
<img src="docs/screenshots/mobile-today.png" width="250" alt="Mobile: structured log" />
<img src="docs/screenshots/mobile-timeline.png" width="250" alt="Mobile: timeline" />
<img src="docs/screenshots/mobile-journeys.png" width="250" alt="Mobile: a task journey" />
</p>

> 🎬 Full-quality clips: [log your day](docs/media/log-your-day.mp4) · [onboarding](docs/media/onboarding.mp4) · [reports](docs/media/reports.mp4) · [journeys](docs/media/journeys.mp4) · [explore](docs/media/explore.mp4) · [mobile](docs/media/mobile.mp4)

---

## 🔗 Connect GitHub & Bitbucket

Go to **Settings → Private & company repos**. You never create an app or token yourself. You click Connect, approve on GitHub's or Bitbucket's own page, and come back.

<p align="center"><img src="docs/screenshots/settings-connect.png" width="880" alt="Settings: public GitHub username, plus Connect GitHub and Connect Bitbucket for private repos" /></p>

### Public GitHub (simplest)

Enter your GitHub username under **GitHub (public)**. ShipLog reads your **public** commits and PRs. No login needed.

### Private & company GitHub repos

1. Click **Connect GitHub**. You're sent to GitHub to install the **ShipLog Voice Journal** app.
2. Choose **All repositories** or **Only select repositories**, on your personal account or an organization. Organizations may ask an admin to approve.
3. You're returned to ShipLog with a list of granted repos.

### Bitbucket

1. Click **Connect Bitbucket** and approve read-only access on bitbucket.org.
2. You're returned to ShipLog with your repositories listed.

### Choose what counts

Every connected repo has a **Track** switch, plus **Track all / Track none**. Excluded repos are never read. Use **Manage access** to change what the provider shares, or **Disconnect** at any time.

> **Bitbucket tip:** commits are matched to your account, so make sure the email you commit with is added in Bitbucket → Personal settings → Email aliases.

---

## 🛰️ How tracking works

```mermaid
flowchart LR
  V["🎙️ You speak<br/>(Wispr Flow)"] --> T[Today]
  T -->|your words| AI[Gemini: structure the day]
  GH[GitHub App / public GitHub] -->|today's commits & PRs<br/>tracked repos only| AI
  BB[Bitbucket OAuth] -->|today's commits & PRs<br/>tracked repos only| AI
  AI --> E[(Your journal entry)]
  AI --> M[Missed from GitHub]
  E --> R[Standup · Weekly · Brag doc]
  E --> TL[Timeline & streaks]
  E --> Q[Ask your journal]
```

1. **When you log a day**, ShipLog fetches that day's commits and pull requests **you authored**, from the repos you track, in parallel across GitHub and Bitbucket. Dates use your own time zone.
2. The AI receives your spoken note plus that activity as reference. It writes the four sections from **what you said**, and lists commits you didn't mention as **missed** suggestions. ShipLog only keeps a "missed" link if it really exists in your activity.
3. Each entry is saved per day. Reports, the timeline and Ask are all built from your saved entries.
4. Activity is read **on demand only**, when you open Today or log a day. There is no background crawling of your code. Results are cached for 5 minutes.

---

## 🔒 Safety & privacy

**What ShipLog can access**

|               | Access                                              | Notes                                                                                   |
| ------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| GitHub App    | **Read-only:** commits, pull requests, metadata     | Only the repos you grant on GitHub, minus any you exclude. No write access to anything. |
| Bitbucket     | **Read-only:** account, repositories, pull requests | Only repos you track in ShipLog.                                                        |
| Public GitHub | Public data only                                    | No login.                                                                               |

**What is stored, and what isn't**

| Stored (Neon Postgres)                                        | Never stored                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Your name, email, **scrypt-hashed** password                  | Your password in plain text                                             |
| Your journal entries and generated reports                    | GitHub access tokens (minted for 1 hour on demand, kept in memory only) |
| GitHub: the installation id and your login                    | Your code or file contents (ShipLog never reads file contents)          |
| Bitbucket: access + refresh tokens, **AES-256-GCM encrypted** | Secrets in the browser (all API keys are server-only)                   |

**How it's protected**

- Sessions are signed JWTs in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie. Mutations are origin-checked (CSRF), and limits are applied per user.
- Connect flows use a **signed, 10-minute state** tied to your account. For GitHub, ShipLog also asks GitHub to confirm you can access the installation before saving it.
- Every database query is parameterised and scoped to your user id. Rows are re-validated on read.
- AI prompts treat your text as data (prompt-injection guard), and the model is told never to invent work, numbers or links.
- Strict Content-Security-Policy and security headers on every page.

**You're in control**

- **Settings → Your data → Export journal (.md)** downloads everything you've logged.
- **Delete account** permanently removes your account, entries, reports and connections in one step.
- **Disconnect** removes stored tokens. You can also revoke access on GitHub or Bitbucket.

**AI provider:** to structure your day and write reports, your log text (and the day's commit titles) is sent to Google Gemini, or to OpenAI if Gemini is unavailable. Nothing else from your repositories is sent.

---

## 🤖 Where we use GenAI

ShipLog runs on **Google Gemini `gemini-3.5-flash`** via the Vercel AI SDK, with **OpenAI `gpt-5.4-mini`** as an automatic fallback.

| Feature                 | Where in the code                                   | What the model does                                                                                                                              | Technique                                                                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Structure my day**    | `POST /api/entries`                                 | Turns a rambling Hinglish note into Done / In progress / Blockers / Tomorrow with projects, and finds commits you didn't mention                 | Structured output (zod schema), grounded on your GitHub/Bitbucket activity                  |
| **Task journeys**       | `POST /api/entries`, `src/lib/server/task-links.ts` | Links each new log item to one of your open tasks (shown to the model as short ids like `t3`), names new tasks, and leaves routine work unlinked | Structured output; ids mapped back server-side, so the model never sees or invents real ids |
| **Follow-up questions** | `POST /api/entries/[id]/refine`                     | Asks up to 3 questions about vague items or blockers, then folds your answers into the log                                                       | Structured output                                                                           |
| **Create ticket**       | `POST /api/tickets`                                 | Writes a GitHub issue (title, context, acceptance criteria, labels) from a blocker                                                               | Structured output                                                                           |
| **Standup**             | `POST /api/reports` (`standup`)                     | Yesterday / Today / Blockers in Slack, Teams or plain format                                                                                     | Streaming, format-specific prompts                                                          |
| **Weekly report**       | `POST /api/reports` (`weekly`)                      | Manager-ready weekly summary                                                                                                                     | Streaming                                                                                   |
| **Brag doc**            | `POST /api/reports` (`brag`)                        | Impact-focused achievements over months, grouped by project                                                                                      | Streaming, facts-only prompt                                                                |
| **Ask your journal**    | `POST /api/ask`                                     | Answers questions about your past work, citing dates                                                                                             | Retrieval with Postgres full-text search, then a grounded answer                            |

**How we keep it fast, cheap and honest**

- **Reports are cached in the database** by a hash of their exact input, so unchanged logs mean no new model call.
- Each task has an output cap and a low reasoning effort (`thinkingLevel: minimal` for extraction), plus a 45-second timeout.
- Answers stream token by token. "Ask" retrieves only the relevant entries instead of sending the whole journal.
- Prompts wrap your text as untrusted data, forbid invented facts, and keep technical names and numbers exactly as spoken.

---

## 🎙️ How Wispr Flow was used

- **To build it:** ShipLog was built by voice. Prompts to my AI coding assistant, product decisions, commit messages, this README and build-in-public posts were dictated with Wispr Flow (see the usage card in the submission).
- **In the product:** Wispr Flow is the input method. The Today screen is one large box designed for dictation: rambling, Hinglish and filler words are expected, and the hints, `⌘/Ctrl + Enter` and the AI clean-up all assume you spoke rather than typed.

---

## 🏗️ Architecture & engineering

```mermaid
flowchart LR
  B[Browser · Next.js 16 / React 19] -->|JSON / streamed text| API[Route handlers · Vercel sin1]
  API --> W["Wrappers: origin → session → rate limit → zod"]
  W --> AI{Gemini · OpenAI fallback}
  W --> DB[(Neon Postgres · Singapore)]
  W --> GH[GitHub App · Search API]
  W --> BB[Bitbucket Cloud API]
```

| Area              | What we did                                                                                                                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code quality**  | Strict TypeScript and small feature modules. One `userRoute`/`publicRoute` wrapper applies auth, CSRF, rate limits and validation in a fixed order. `knip` keeps dead code at zero, and an ESLint rule blocks server code and `zod` in client components.                                |
| **Efficiency**    | Functions **and** database co-located in Singapore. No `zod` in the browser bundle. SQL `GROUP BY` for the heatmap, a GIN full-text index for Ask, and `(user_id, date)` indexes. Bulk inserts. Cached GitHub/Bitbucket calls with bounded concurrency. Frame-batched streaming renders. |
| **Security**      | See [Safety & privacy](#-safety--privacy).                                                                                                                                                                                                                                               |
| **Accessibility** | WCAG 2.1 AA scans of every page in light and dark mode. Labelled controls, `aria-live` AI output, a keyboard-operable heatmap and command menu, 44px touch targets, and reduced-motion support.                                                                                          |
| **Testing**       | 155 unit/route/component tests (Vitest, AI mocked) and 71 Playwright end-to-end tests on desktop and mobile, including real AI calls, onboarding and data deletion, plus axe accessibility scans. CI runs lint, dead-code check, typecheck, tests and build.                             |

**Tech:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Vercel AI SDK · Google Gemini · OpenAI · Neon Postgres · GitHub App · Bitbucket OAuth · Vitest · Playwright · axe-core. Design system: Vercel's Geist, via DESIGN.md from getdesign.md.

---

## 🛠️ Run it yourself

```bash
pnpm install
cp .env.example .env.local     # fill in the values below
pnpm db:migrate                # creates tables and the shared demo account
pnpm dev
```

| Variable                            | Required     | Purpose                                                                                                                                                                                         |
| ----------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | At least one | AI provider (`AI_PROVIDER` picks the preferred one)                                                                                                                                             |
| `DATABASE_URL`                      | ✅           | Neon Postgres                                                                                                                                                                                   |
| `AUTH_SECRET`                       | ✅           | Signs sessions and derives the token-encryption key (`openssl rand -base64 32`)                                                                                                                 |
| `GITHUB_APP_*`                      | Optional     | Private GitHub repos. Run `node scripts/create-github-app.mjs https://your-domain` once (GitHub manifest flow, one click).                                                                      |
| `BITBUCKET_CLIENT_ID` / `_SECRET`   | Optional     | Bitbucket. Create an OAuth client in _Workspace settings → OAuth clients_ with callback `https://your-domain/api/bitbucket/callback` and read-only account, repository and pull request scopes. |
| `DEMO_GITHUB_USERNAME`              | Optional     | Public GitHub user whose activity demo accounts show                                                                                                                                            |

**Tests:** `pnpm test` (unit), `pnpm test:e2e` (Playwright, uses real AI when a key is set), `pnpm check` (everything CI runs).

**Docs media:** `node scripts/capture-docs.mjs` re-records every screenshot and clip from a running app, and `scripts/encode-media.sh` converts them into the MP4s and GIFs above.

# Linity · Generative UI Challenge

Welcome, and thanks for taking the time. This is a small, self-contained take-home for the **Product Engineer** role. It's designed to take a strong engineer **about 3-4 hours**. Please don't spend a weekend on it: we'd rather see a focused, well-reasoned slice than an exhausted marathon. If you run out of time, stop and tell us what you'd do next (see [What to submit](#what-to-submit)).

You're building on the real Linity design system and the same AI stack we use in production, so this is a genuine taste of the work.

---

## The idea: generative UI

Most chatbots reply with text. **Generative UI** means the model replies with _real, interactive components_. Instead of writing "It's 18°C and sunny in Lisbon", the assistant calls a tool and the app renders a live weather card.

The mechanism (Vercel AI SDK):

1. You define a **tool** with a typed input schema (`lib/tools.ts`).
2. The model decides to call it and fills in the arguments.
3. Your server runs the tool and returns typed data (`app/api/chat/route.ts`).
4. The client maps the resulting `tool-<name>` message part to a **React component** you build (`components/chat.tsx`).

We've built one end-to-end example for you: **the weather card**. Run the app, ask _"What's the weather in Lisbon?"_, and read those four files to see exactly how the loop works.

---

## Your task

**Let the assistant answer questions about a dataset by rendering an interactive table _and_ a chart, not prose.**

We ship a local dataset of board games at [`data/games.json`](./data/games.json) (name, category, player count, play time, complexity, rating, year). Your job:

1. **Add a tool** in `lib/tools.ts` (e.g. `queryGames`) that takes structured arguments (filters like category / player count / min rating, and a sort) and returns the matching rows from `data/games.json`. Wire it into the route's `tools`.
2. **Build the interactive table.** Render the result as a table in the chat that is:
   - **Sortable** by clicking column headers,
   - **Filterable** with a text box (on top of whatever the model already filtered),
   - **Paginated** or scrollable when there are many rows.
3. **Build the chart, linked to the table.** Add a chart (a bar/scatter of something meaningful, e.g. rating vs. complexity, or count by category) that visualizes **the same result set as the table**. When the user filters or refines, the table and the chart update together. [Recharts](https://recharts.org) is pre-installed, and the `chart-1…5` design tokens are wired for you.
4. **Handle the states**: a loading skeleton while the tool runs, a clean empty state when nothing matches, and an error state if the tool throws, for both the table and the chart.

For example: a user asks _"show me co-op games under 90 minutes, highest rated first"_, gets a table and a chart, and can keep exploring from there. Make that flow feel natural.

> **Treat this brief as a starting point, not a spec to obey literally.** If you think something should work differently, or you have a better idea for the interaction, do that instead, just tell us why in your notes. We're more interested in your judgment than in your ability to follow instructions.

### Constraints

- Use the stack that's here: **Next.js (App Router) + Vercel AI SDK + the provided shadcn/ui components + Recharts** (pre-installed for the chart). Don't add another component or charting library.
- **No external APIs.** Everything runs off the local dataset. (The weather example uses mock data too.)
- Keep it on-brand: build with the components in `components/ui/` and the semantic classes (`bg-card`, `text-muted-foreground`, `border-border`, the `lime` accent). Don't hand-pick colors.
- Using AI assistants (Copilot, Claude, Cursor, v0, …) is **completely fine and encouraged** — it's how we work. We care about the judgment in what you shipped, not whether you typed every character. But we do want to see _how you work with it_: in `NOTES.md`, tell us what you delegated, one thing the AI got wrong and how you caught it, and a spot where you overrode its suggestion (see below). Be ready to walk through and extend any part of your code live.

### Stretch goals (optional — for standing out, not for completing)

Only after the core works, pick whatever interests you:

- A **second interactive action** that goes _back_ to the model: e.g. select rows and ask the assistant to "summarize my selection", or a "find similar" button on a row.
- **Cross-highlighting** between the chart and table (hover a bar, highlight its rows, or vice versa).
- **Column visibility** controls or CSV export.
- Anything that shows product taste. Surprise us.

---

## Setup

Prerequisites: **Node 20+** and **pnpm** (`npm i -g pnpm`).

```bash
pnpm install
cp .env.example .env.local     # then paste your free Gemini key into .env.local
pnpm dev                       # http://localhost:3000
```

**Get a free API key** at <https://aistudio.google.com/apikey> — no credit card, and the free tier (1,500 requests/day) is far more than this challenge needs. The app uses Google's `gemini-3.5-flash` by default.

---

## Where to work

| File | What it is |
| --- | --- |
| `lib/tools.ts` | Tool definitions. **Add your `queryGames` tool here** (there's a marked spot). |
| `app/api/chat/route.ts` | The chat endpoint. Update the system prompt so the model knows to use your tool. |
| `components/chat.tsx` | Renders each message part. **Add a branch for your `tool-queryGames` part** next to the weather one. |
| `components/tools/` | Your generative-UI components live here (`weather-card.tsx` is the worked example). |
| `data/games.json` | The dataset. Don't edit it. |
| `components/ui/` | The Linity component library (Button, Card, Table, Input, Badge, Skeleton, …). |

You should not need to touch the config, `globals.css`, or the design tokens.

---

## What to submit

Send back the project as a zip (or a link to a private repo) **including your `NOTES.md`** and, if you use git, the `.git` history — we like seeing how you work.

Fill in [`NOTES.md`](./NOTES.md) (a template is included) with:

- **Decisions & trade-offs** — what you chose and why.
- **What you cut for time** and what you'd do with another day.
- **How you used AI** — what you delegated, one thing it got wrong and how you caught it, and a place you overrode it.
- Anything you want us to look at first.

A 2-3 minute Loom walking us through it is welcome but optional. Note: we'll also do a short live session afterward where you extend your own code, so make sure you understand every part of what you submit.

---

## How we evaluate

We're transparent about the bar. Each dimension is scored and weighted:

| Dimension | Weight | What we're looking for |
| --- | --- | --- |
| **Product judgment & UX** | 30% | Did you solve the user's real problem? Empty/loading/error states, sensible defaults, does it feel good to use? |
| **Handling ambiguity & scope** | 20% | Reasonable assumptions stated; the right things prioritized under the time cap; no gold-plating. |
| **Code quality & clarity** | 20% | Readable, typed end-to-end, the tool schema as the single source of truth, no needless complexity. |
| **Functionality** | 15% | It works. The model calls your tool; the table sorts, filters, paginates; states are handled. |
| **Communication** | 15% | Your `NOTES.md`: clear reasoning about trade-offs. |

We weight judgment and communication heavily, so your `NOTES.md` and the choices you make matter as much as the code.

Good luck, and have fun with it.

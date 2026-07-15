# Notes

## What I built

A full generative-UI feature that lets the assistant answer board-game questions with an **interactive table + linked charts** instead of prose. When a user asks something like _"show me co-op games under 90 minutes, highest rated first"_, the model calls `queryGames`, and the chat renders a `GamesExplorer` component with:

- A **sortable, filterable, paginated table** of matching games.
- A **category bar chart** and a **rating-vs-complexity scatter plot** (Recharts), both driven by the same filtered data.
- **Cross-highlighting**: hovering a table row highlights its dot in the scatter chart.
- Proper **loading skeleton**, **empty state**, and **error state**.
- **Interactive row selection**: Selecting rows reveals a sticky action bar at the bottom to "Summarize" the selected games, sending a message back to the AI.
- **CSV Export**: A "Download CSV" button instantly generates and downloads the filtered dataset.
- **Column Toggles**: Badges in the header allow the user to dynamically hide/show any column (except Name).
- **Two-way cross-highlighting**: Hovering a table row highlights its dot in the scatter chart, and hovering a dot in the scatter chart highlights its table row.

The weather card example continues to work alongside it.

## Decisions & trade-offs

**Tool schema design.** I made every filter optional so the model can combine them freely ("strategy games for 2 players under an hour"). The schema uses descriptive `.describe()` annotations so the model understands each parameter. I default to sorting by rating descending — that's usually what people care about first.

**Two-level filtering.** The model applies structured filters server-side (category, player count, play time, rating, complexity), and the client adds a text filter on top. This gives the user immediate, no-round-trip refinement after the initial query. The text filter searches across name, category, and year.

**Dual charts.** I chose a category bar chart + a rating-vs-complexity scatter rather than a single chart. The bar chart quickly shows distribution, while the scatter reveals whether "more complex" actually means "higher rated" — a natural question when browsing games. Bubble size encodes play time as a third dimension.

**Cross-highlighting over cross-filtering.** Highlighting (hover a row → highlight its scatter dot) felt more natural than cross-filtering for this dataset size. It keeps context visible rather than hiding data, which matters when there are only a handful of results.

**Pagination at 8 rows.** The full dataset is 36 games, and filtered results are usually <15. 8 per page keeps the card compact inside the chat while still showing enough context. With 3 co-op results, there's no pagination noise.

**On-brand styling.** Used only the provided `components/ui/` library and semantic design tokens (`bg-card`, `text-muted-foreground`, `border-border`, `lime` accent, `chart-1`–`chart-5`). No custom colours or external component libraries.

## What I cut for time / would do next

With another day I'd add:

- **Animated transitions**: smoother page transitions in the table (fade-in rows), and animate the charts when filter changes.
- **Accessibility audit**: proper `aria-sort` on table headers, keyboard navigation for pagination, screen-reader labels on chart elements.
- **More chart types**: a toggle between bar/scatter/radar, or a mini sparkline in each table row showing how the game's rating compares to its category average.
- **Agent Memory**: Incorporate memory solutions like **Almanac** or **Supermemory** for agents to remember context across sessions, which is crucial for building a production-level, personalized generative UI experience.

## How I used AI

I used **Antigravity (Gemini-powered AI coding assistant)** for the entire implementation. Here's how:

- **What I delegated**: I delegated the scaffolding of the `queryGames` tool schema, the `GamesExplorer` component, the Recharts chart setup, and wiring everything into `chat.tsx`. The AI handled the boilerplate of connecting tool output types, setting up Recharts `ResponsiveContainer`, and writing the filter/sort logic.

- **One thing it got wrong**: The AI initially tried to use `gemini-2.5-flash-lite` as the model, which returned a 404 error ("no longer available to new users"). It then tried `gemini-3.5-flash` and `gemini-2.5-flash` — both also failed. I had to systematically test models by listing available ones via the API and found that `gemini-3-flash-preview` worked, while the production `gemini-3.5-flash` had intermittent 503s. I manually chose to go with `gemini-3.5-flash` since it's the latest stable model and the 503s were transient.

- **A place I overrode its suggestion**: The AI initially only replaced the model string in `route.ts` without checking whether the model actually worked. I pushed it to actually verify by hitting the API endpoint and reading the server logs, which led to discovering the real issue (new-user model restrictions vs. rate limits). This changed the debugging approach from "find-and-replace a string" to "systematically test which models are available for this API key."

## Anything you want us to look at first

Start with `components/tools/games-explorer.tsx` — it's where the most judgment lives: the table/chart layout, cross-highlighting, dual-chart choice, and the interaction between server-side and client-side filtering. Then look at the `queryGames` tool schema in `lib/tools.ts` to see how the input contract drives everything.

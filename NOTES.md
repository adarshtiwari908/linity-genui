# Notes

## What I built

I built a generative UI feature so the assistant can answer board game questions with an actual interactive table and charts instead of just replying with text. So if someone asks something like "show me co-op games under 90 minutes, highest rated first" the model calls a queryGames tool and the chat shows a games explorer with a table you can sort, filter and page through, plus two charts made with recharts that update with the same filtered data. I also added hovering a table row to highlight its dot on the scatter chart and the other way around, a way to select rows and ask the assistant to summarize them, a button to download the filtered games as CSV, and toggles to hide or show table columns. Loading, empty and error states are handled for both the table and the charts. The weather card example still works fine alongside all this.

## Decisions and trade-offs

I made every filter in the tool optional so the model can mix and match them freely, like "strategy games for 2 players under an hour." I added short descriptions to each field so the model understands what they mean. By default it sorts by rating high to low since that felt like what most people want first.

Filtering happens in two places. The model applies the structured filters like category, players, time, rating and complexity on the server. Then I added a text search box on the client so users can refine further without waiting on the model again. That box searches across name, category and year.

For charts I went with two, a bar chart showing count by category and a scatter plot of rating versus complexity. The bar chart gives a quick sense of how many games are in each category, and the scatter answers a natural follow-up question of whether harder games actually rate higher. I also used bubble size to show play time as a third value on the scatter.

Instead of cross-filtering between the chart and table I went with cross-highlighting, hovering a row lights up its dot and hovering a dot lights up its row. Felt more natural for this size of data since it keeps everything visible instead of hiding rows.

Pagination is set to 8 rows per page. The full dataset is 36 games and most filtered results come back under 15, so 8 keeps the card compact but still useful, and results with just a few matches don't get weird pagination.

For styling I stuck to the components already provided and the design tokens like bg-card, text-muted-foreground, border-border, the lime accent and the chart tokens. No hand-picked colors and no outside libraries.

## If I had run out of time

The brief said to stop and say what I'd do next if the time cap hit, so here is roughly how I would have prioritized if I had less room to work with. The queryGames tool and wiring it into the chat route would come first since nothing else works without it. Next would be the plain table with sorting and the text filter, since that alone answers the core ask. After that the loading, empty and error states, since those are explicitly asked for and a missing state is a visible gap. The chart would come after the table is solid, since the table alone can already answer most questions on its own. Everything past that, cross-highlighting, CSV export, column toggles, row selection and summarize, is stretch, and I would have cut all of it first before touching the core loop, table, or states. In the end I had enough time to get through the stretch goals too, but if the cap had hit earlier that is the order I would have dropped things in.

## What I cut for time

With more time I would add small animations, like rows fading in and charts animating when filters change. I would also do a real accessibility pass, proper aria-sort on the table headers, keyboard support for pagination, and labels for screen readers on the chart parts. Another idea is more chart types, maybe a toggle between bar, scatter and radar, or a small sparkline per row comparing a game's rating to its category average.

## How I used AI

I used Antigravity mainly to speed up the boring parts, writing out the recharts setup, connecting the tool's output types to the components, and some of the repetitive filter and sort logic. The actual decisions, what filters to expose, which two charts to use, how pagination should behave, and the highlighting approach, were mine, I just had it type faster once I knew what I wanted.

One thing it got wrong was the model name. It first tried a model that returned a 404 saying it was no longer available for new users, then tried another one that also failed. I ended up checking which models were actually available for my API key and picked the one that worked reliably instead of just trusting the first fix.

A place I overrode it was when it just swapped the model string without actually checking if it worked. I made it go back and actually hit the endpoint and read the server logs instead of assuming a string replace was enough, which is what led to finding the real problem.

## Where to look first

Start with the games explorer component, that is where most of the actual thinking is, the table and chart layout, the highlighting, and how server-side and client-side filtering work together. After that look at the queryGames tool in lib/tools.ts to see how the input shape drives everything else.

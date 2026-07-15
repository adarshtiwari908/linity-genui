import { type InferUITools, type UIMessage, tool } from 'ai'
import { z } from 'zod'

/**
 * Tools the model can call. Each tool is the contract between the model's
 * output and the React component that renders it: the model fills in the
 * `inputSchema`, `execute` returns typed data, and the client maps the
 * resulting `tool-<name>` message part to a component (see components/chat.tsx).
 *
 * `getWeather` is a complete, working example of the generative-UI pattern.
 * It uses mock data so no external API key is needed.
 */
export const tools = {
    getWeather: tool({
        description:
            'Get the current weather for a city. Call this whenever the user asks about the weather somewhere.',
        inputSchema: z.object({
            city: z.string().describe('The city name, e.g. "Lisbon"'),
        }),
        execute: async ({ city }) => {
            // Mock, deterministic-per-city weather. Replace with a real API only
            // if you want to; the challenge does not require external calls.
            const conditions = ['Sunny', 'Partly cloudy', 'Rainy', 'Clear'] as const
            const seed = [...city].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
            return {
                city,
                temperatureC: 12 + (seed % 18),
                condition: conditions[seed % conditions.length],
                humidity: 40 + (seed % 50),
                windKph: 5 + (seed % 25),
            }
        },
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // 👇 YOUR TASK: add a tool here that queries `data/games.json` and returns
    //    structured rows for the UI to render. See README.md for the brief.
    // ─────────────────────────────────────────────────────────────────────────

    queryGames: tool({
        description:
            'Query the board games dataset. Call this whenever the user asks about board games, wants to browse, filter, compare, or explore games. Returns matching rows for a table and chart.',
        inputSchema: z.object({
            category: z
                .string()
                .optional()
                .describe(
                    'Filter by category. One of: Strategy, Family, Cooperative, Card, Abstract, Party',
                ),
            minPlayers: z
                .number()
                .optional()
                .describe('Minimum number of players the game must support'),
            maxPlayers: z
                .number()
                .optional()
                .describe('Maximum number of players the game must support'),
            maxPlayTime: z
                .number()
                .optional()
                .describe('Maximum play time in minutes'),
            minRating: z.number().optional().describe('Minimum rating (0–10 scale)'),
            minComplexity: z.number().optional().describe('Minimum complexity (0–5 scale)'),
            maxComplexity: z.number().optional().describe('Maximum complexity (0–5 scale)'),
            sortBy: z
                .enum(['rating', 'complexity', 'playTimeMinutes', 'yearPublished', 'name'])
                .optional()
                .describe('Column to sort results by'),
            sortOrder: z
                .enum(['asc', 'desc'])
                .optional()
                .describe('Sort direction, defaults to desc'),
        }),
        execute: async (args) => {
            const { default: allGames } = await import('@/data/games.json')

            let games = [...allGames]

            // Apply filters
            if (args.category) {
                const cat = args.category.toLowerCase()
                games = games.filter((g) => g.category.toLowerCase() === cat)
            }
            if (args.minPlayers != null) {
                games = games.filter((g) => g.maxPlayers >= args.minPlayers!)
            }
            if (args.maxPlayers != null) {
                games = games.filter((g) => g.minPlayers <= args.maxPlayers!)
            }
            if (args.maxPlayTime != null) {
                games = games.filter((g) => g.playTimeMinutes <= args.maxPlayTime!)
            }
            if (args.minRating != null) {
                games = games.filter((g) => g.rating >= args.minRating!)
            }
            if (args.minComplexity != null) {
                games = games.filter((g) => g.complexity >= args.minComplexity!)
            }
            if (args.maxComplexity != null) {
                games = games.filter((g) => g.complexity <= args.maxComplexity!)
            }

            // Sort
            const sortBy = args.sortBy ?? 'rating'
            const sortOrder = args.sortOrder ?? 'desc'
            const dir = sortOrder === 'asc' ? 1 : -1

            games.sort((a, b) => {
                const aVal = a[sortBy as keyof typeof a]
                const bVal = b[sortBy as keyof typeof b]
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return dir * aVal.localeCompare(bVal)
                }
                return dir * (Number(aVal) - Number(bVal))
            })

            return {
                games,
                totalCount: allGames.length,
                matchCount: games.length,
                appliedFilters: {
                    category: args.category ?? null,
                    minPlayers: args.minPlayers ?? null,
                    maxPlayers: args.maxPlayers ?? null,
                    maxPlayTime: args.maxPlayTime ?? null,
                    minRating: args.minRating ?? null,
                    minComplexity: args.minComplexity ?? null,
                    maxComplexity: args.maxComplexity ?? null,
                },
                sortBy,
                sortOrder,
            }
        },
    }),
}

export type ChatTools = typeof tools

/** A chat message whose tool parts are fully typed from `tools` above. */
export type ChatUIMessage = UIMessage<never, never, InferUITools<typeof tools>>

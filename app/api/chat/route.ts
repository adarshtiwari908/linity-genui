import { google } from '@ai-sdk/google'
import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from 'ai'

import { tools } from '@/lib/tools'

export const maxDuration = 30

const SYSTEM_PROMPT = `You are a helpful, concise assistant embedded in a chat app for the "Linity Generative UI Challenge".

You can render rich, interactive UI by calling tools instead of describing things in prose:
- When the user asks about the weather, call the getWeather tool. Do not describe the weather in text; the UI renders a card from the tool result.
- When the user asks about board games — browsing, filtering, comparing, or exploring — call the queryGames tool. Use the structured arguments to apply filters (category, player count, play time, rating, complexity) and sorting. Do not list games in text; the UI renders an interactive table and chart from the tool result.

After a tool runs, add at most one short sentence of context. Keep replies brief and friendly.`

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = streamText({
        model: google('gemini-3.5-flash'),
        system: SYSTEM_PROMPT,
        messages: await convertToModelMessages(messages),
        tools,
        stopWhen: stepCountIs(5),
    })

    return result.toUIMessageStreamResponse()
}

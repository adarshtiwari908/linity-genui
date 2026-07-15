'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { GamesExplorer, GamesExplorerSkeleton } from '@/components/tools/games-explorer'
import { WeatherCard, WeatherCardSkeleton } from '@/components/tools/weather-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { ChatUIMessage } from '@/lib/tools'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
    "What's the weather in Lisbon?",
    'Show me co-op games under 90 minutes',
    'What are the highest rated strategy games?',
]

export function Chat() {
    const [input, setInput] = useState('')
    const { messages, sendMessage, status } = useChat<ChatUIMessage>({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
    })

    const isBusy = status === 'submitted' || status === 'streaming'

    function submit(text: string) {
        const trimmed = text.trim()
        if (!trimmed || isBusy) return
        sendMessage({ text: trimmed })
        setInput('')
    }

    return (
        <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
            <header className="flex items-center gap-2 border-b border-border px-5 py-4">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Sparkles className="size-4" />
                </span>
                <div>
                    <h1 className="text-sm font-semibold leading-none">Generative UI Challenge</h1>
                    <p className="text-xs text-muted-foreground">Linity · powered by Gemini</p>
                </div>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Ask about the weather to see the generative-UI pattern in action, then
                            build your own. Try:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {SUGGESTIONS.map((s) => (
                                <Button
                                    key={s}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => submit(s)}
                                >
                                    {s}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            'flex flex-col gap-2',
                            message.role === 'user' ? 'items-end' : 'items-start',
                        )}
                    >
                        {message.parts.map((part, i) => {
                            if (part.type === 'text') {
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                                            message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-foreground',
                                        )}
                                    >
                                        {part.text}
                                    </div>
                                )
                            }

                            if (part.type === 'tool-getWeather') {
                                switch (part.state) {
                                    case 'input-streaming':
                                    case 'input-available':
                                        return <WeatherCardSkeleton key={i} />
                                    case 'output-available':
                                        return <WeatherCard key={i} {...part.output} />
                                    case 'output-error':
                                        return <ToolError key={i} message={part.errorText} />
                                }
                            }

                            if (part.type === 'tool-queryGames') {
                                switch (part.state) {
                                    case 'input-streaming':
                                    case 'input-available':
                                        return <GamesExplorerSkeleton key={i} />
                                    case 'output-available':
                                        return <GamesExplorer key={i} {...part.output} onAction={submit} />
                                    case 'output-error':
                                        return <ToolError key={i} message={part.errorText} />
                                }
                            }

                            // Any other tool part (e.g. a tool you add before you have built
                            // its component) renders as raw JSON so you can see it working.
                            if (part.type.startsWith('tool-')) {
                                return <RawToolPart key={i} part={part} />
                            }

                            return null
                        })}
                    </div>
                ))}

                {isBusy && messages.at(-1)?.role === 'user' && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                )}
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    submit(input)
                }}
                className="flex items-center gap-2 border-t border-border p-4"
            >
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask something…"
                    disabled={isBusy}
                />
                <Button type="submit" size="icon" disabled={isBusy || !input.trim()}>
                    <ArrowUp className="size-4" />
                </Button>
            </form>
        </div>
    )
}

function ToolError({ message }: { message?: string }) {
    return (
        <Card className="w-full max-w-sm border-destructive/40 py-3">
            <CardContent className="text-sm text-destructive">
                Something went wrong{message ? `: ${message}` : '.'}
            </CardContent>
        </Card>
    )
}

function RawToolPart({ part }: { part: { type: string; output?: unknown } }) {
    return (
        <Card className="w-full max-w-md py-3">
            <CardContent className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{part.type}</p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(part.output ?? part, null, 2)}
                </pre>
            </CardContent>
        </Card>
    )
}

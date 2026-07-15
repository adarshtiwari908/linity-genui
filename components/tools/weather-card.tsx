import { Cloud, CloudRain, Droplets, Sun, Wind } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * A worked example of the generative-UI pattern: the `getWeather` tool returns
 * this shape, and the chat maps its `tool-getWeather` message part to this
 * component. Use it as a reference for the component(s) you build for the task.
 */
export type WeatherData = {
    city: string
    temperatureC: number
    condition: string
    humidity: number
    windKph: number
}

const ICONS: Record<string, typeof Sun> = {
    Sunny: Sun,
    Clear: Sun,
    'Partly cloudy': Cloud,
    Rainy: CloudRain,
}

export function WeatherCard({ city, temperatureC, condition, humidity, windKph }: WeatherData) {
    const Icon = ICONS[condition] ?? Cloud

    return (
        <Card className="w-full max-w-sm overflow-hidden py-0">
            <CardContent className="flex items-center justify-between gap-4 bg-gradient-to-br from-card to-secondary p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{city}</p>
                    <p className="text-4xl font-semibold tracking-tight">{temperatureC}°C</p>
                    <p className="mt-1 text-sm text-muted-foreground">{condition}</p>
                </div>
                <Icon className="size-14 text-lime" strokeWidth={1.5} />
            </CardContent>
            <CardContent className="flex gap-6 border-t border-border px-5 pb-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Droplets className="size-4" /> {humidity}%
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Wind className="size-4" /> {windKph} km/h
                </span>
            </CardContent>
        </Card>
    )
}

export function WeatherCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn('w-full max-w-sm py-0', className)}>
            <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="size-14 rounded-full" />
            </CardContent>
        </Card>
    )
}

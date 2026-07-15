'use client'

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, TableIcon, BarChart3, Inbox, Download, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    ScatterChart,
    Scatter,
    ZAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

export type Game = {
    id: number
    name: string
    category: string
    minPlayers: number
    maxPlayers: number
    playTimeMinutes: number
    complexity: number
    rating: number
    yearPublished: number
}

type SortKey = keyof Game
type SortDir = 'asc' | 'desc'

export type GamesExplorerData = {
    games: Game[]
    totalCount: number
    matchCount: number
    appliedFilters: Record<string, string | number | null>
    sortBy: string
    sortOrder: string
    onAction?: (msg: string) => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 8

const CHART_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
]

const CATEGORY_COLORS: Record<string, string> = {
    Strategy: 'var(--chart-1)',
    Family: 'var(--chart-2)',
    Cooperative: 'var(--chart-3)',
    Card: 'var(--chart-4)',
    Abstract: 'var(--chart-5)',
    Party: 'var(--lime)',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function activeFilterBadges(filters: Record<string, string | number | null>) {
    return Object.entries(filters)
        .filter(([, v]) => v != null)
        .map(([key, value]) => {
            const labels: Record<string, string> = {
                category: 'Category',
                minPlayers: 'Min Players',
                maxPlayers: 'Max Players',
                maxPlayTime: 'Max Time',
                minRating: 'Min Rating',
                minComplexity: 'Min Complexity',
                maxComplexity: 'Max Complexity',
            }
            return { label: labels[key] ?? key, value: String(value) }
        })
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GamesExplorer(data: GamesExplorerData) {
    const [filter, setFilter] = useState('')
    const [sortKey, setSortKey] = useState<SortKey>('rating')
    const [sortDir, setSortDir] = useState<SortDir>('desc')
    const [page, setPage] = useState(0)
    const [hoveredGame, setHoveredGame] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(['category', 'players', 'time', 'complexity', 'rating', 'year']))

    // Client-side filter + sort (on top of server-side)
    const processed = useMemo(() => {
        let games = [...data.games]

        // Text filter
        if (filter.trim()) {
            const q = filter.toLowerCase()
            games = games.filter(
                (g) =>
                    g.name.toLowerCase().includes(q) ||
                    g.category.toLowerCase().includes(q) ||
                    String(g.yearPublished).includes(q),
            )
        }

        // Sort
        games.sort((a, b) => {
            const aVal = a[sortKey]
            const bVal = b[sortKey]
            const dir = sortDir === 'asc' ? 1 : -1
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return dir * aVal.localeCompare(bVal)
            }
            return dir * (Number(aVal) - Number(bVal))
        })

        return games
    }, [data.games, filter, sortKey, sortDir])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
    const safePage = Math.min(page, totalPages - 1)
    const paged = processed.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

    // Reset page when filter changes
    const handleFilterChange = (value: string) => {
        setFilter(value)
        setPage(0)
    }

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(key)
            setSortDir(key === 'name' ? 'asc' : 'desc')
        }
        setPage(0)
    }

    function SortIcon({ column }: { column: SortKey }) {
        if (sortKey !== column) return <ArrowUpDown className="ml-1 inline size-3 text-muted-foreground/50" />
        return sortDir === 'asc' ? (
            <ArrowUp className="ml-1 inline size-3 text-lime" />
        ) : (
            <ArrowDown className="ml-1 inline size-3 text-lime" />
        )
    }

    const toggleCol = (col: string) => {
        setVisibleCols(prev => {
            const next = new Set(prev)
            if (next.has(col)) next.delete(col)
            else next.add(col)
            return next
        })
    }

    const toggleSelection = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === paged.length && paged.length > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(paged.map(g => g.id)))
        }
    }

    const exportCSV = () => {
        const headers = ['Name', 'Category', 'Min Players', 'Max Players', 'Play Time', 'Complexity', 'Rating', 'Year']
        const rows = processed.map(g => [
            `"${g.name.replace(/"/g, '""')}"`, 
            `"${g.category}"`, 
            g.minPlayers, 
            g.maxPlayers, 
            g.playTimeMinutes, 
            g.complexity, 
            g.rating, 
            g.yearPublished
        ].join(','))
        const csv = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'board-games.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    const summarizeSelection = () => {
        if (!data.onAction || selectedIds.size === 0) return
        const selectedGames = processed.filter(g => selectedIds.has(g.id)).map(g => g.name)
        data.onAction(`Please compare and summarize these games: ${selectedGames.join(', ')}`)
        setSelectedIds(new Set())
    }

    const badges = activeFilterBadges(data.appliedFilters)

    // Chart data: rating vs complexity scatter
    const chartData = processed.map((g) => ({
        name: g.name,
        rating: g.rating,
        complexity: g.complexity,
        category: g.category,
        playTime: g.playTimeMinutes,
    }))

    // Category count for bar chart
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const g of processed) {
            counts[g.category] = (counts[g.category] ?? 0) + 1
        }
        return Object.entries(counts)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
    }, [processed])

    const showScatter = processed.length > 1

    return (
        <Card className="w-full max-w-2xl py-0 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-br from-card to-secondary px-5 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TableIcon className="size-4 text-lime" />
                            Board Games
                            <Badge variant="lime" className="ml-1">
                                {processed.length} of {data.totalCount}
                            </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {data.matchCount === data.totalCount
                                ? 'Showing all games'
                                : `${data.matchCount} games matched your query`}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs h-8">
                        <Download className="mr-2 size-3.5" />
                        Export CSV
                    </Button>
                </div>

                {/* Active filter badges */}
                {badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {badges.map((b) => (
                            <Badge key={b.label} variant="outline" className="text-xs">
                                {b.label}: {b.value}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-4 px-5 py-4">
                {/* Client-side filter & column toggles */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="games-filter-input"
                            placeholder="Filter games…"
                            value={filter}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground mr-1">Cols:</span>
                        {['category', 'players', 'time', 'complexity', 'rating', 'year'].map(col => (
                            <Badge 
                                key={col} 
                                variant={visibleCols.has(col) ? 'default' : 'secondary'}
                                className={cn("cursor-pointer select-none text-[10px] px-1.5", visibleCols.has(col) ? "bg-lime text-lime-foreground" : "opacity-50")}
                                onClick={() => toggleCol(col)}
                            >
                                {col}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Empty state */}
                {processed.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <Inbox className="size-10 text-muted-foreground/40" />
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">No games found</p>
                            <p className="text-xs text-muted-foreground/70">
                                {filter ? 'Try a different search term' : 'No games match the current filters'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chart section */}
                        <div className="grid gap-4" style={{ gridTemplateColumns: showScatter ? '1fr 1fr' : '1fr' }}>
                            {/* Category bar chart */}
                            <div className="rounded-lg border border-border bg-card p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                    <BarChart3 className="size-3" />
                                    Games by Category
                                </p>
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={categoryCounts} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                                        <XAxis
                                            dataKey="category"
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            axisLine={{ stroke: 'var(--border)' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                color: 'var(--foreground)',
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {categoryCounts.map((entry, i) => (
                                                <Cell
                                                    key={entry.category}
                                                    fill={CATEGORY_COLORS[entry.category] ?? CHART_COLORS[i % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Rating vs Complexity scatter */}
                            {showScatter && (
                                <div className="rounded-lg border border-border bg-card p-3">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                                        Rating vs. Complexity
                                    </p>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <ScatterChart margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                                            <XAxis
                                                dataKey="complexity"
                                                name="Complexity"
                                                type="number"
                                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                                axisLine={{ stroke: 'var(--border)' }}
                                                tickLine={false}
                                                tickFormatter={(v: number) => Number(v.toFixed(1)).toString()}
                                                label={{ value: 'Complexity', position: 'bottom', fontSize: 10, fill: 'var(--muted-foreground)', offset: -2 }}
                                            />
                                            <YAxis
                                                dataKey="rating"
                                                name="Rating"
                                                type="number"
                                                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v: number) => Number(v.toFixed(1)).toString()}
                                                label={{ value: 'Rating', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--muted-foreground)', offset: 20 }}
                                            />
                                            <ZAxis dataKey="playTime" range={[40, 200]} name="Play Time" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--card)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    color: 'var(--foreground)',
                                                }}
                                                formatter={(value: number, name: string) => {
                                                    if (name === 'Play Time') return [`${value} min`, name]
                                                    return [value, name]
                                                }}
                                                labelFormatter={(_, payload) => {
                                                    const item = payload?.[0]?.payload
                                                    return item?.name ?? ''
                                                }}
                                            />
                                            <Scatter data={chartData}>
                                                {chartData.map((entry, i) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={CATEGORY_COLORS[entry.category] ?? CHART_COLORS[i % CHART_COLORS.length]}
                                                        opacity={hoveredGame === entry.name ? 1 : hoveredGame ? 0.3 : 0.85}
                                                        stroke={hoveredGame === entry.name ? 'var(--foreground)' : 'none'}
                                                        strokeWidth={2}
                                                        onMouseEnter={() => setHoveredGame(entry.name)}
                                                        onMouseLeave={() => setHoveredGame(null)}
                                                    />
                                                ))}
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="rounded-lg border border-border overflow-hidden relative">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[40px] text-center px-0">
                                            <input 
                                                type="checkbox" 
                                                className="accent-lime size-3.5 cursor-pointer align-middle"
                                                checked={selectedIds.size > 0 && selectedIds.size === paged.length}
                                                onChange={toggleAll}
                                            />
                                        </TableHead>
                                        <SortableHead column="name" label="Name" onSort={handleSort} sortKey={sortKey} sortDir={sortDir} Icon={SortIcon} />
                                        {visibleCols.has('category') && <SortableHead column="category" label="Category" onSort={handleSort} sortKey={sortKey} sortDir={sortDir} Icon={SortIcon} />}
                                        {visibleCols.has('players') && <TableHead className="text-center">Players</TableHead>}
                                        {visibleCols.has('time') && <SortableHead column="playTimeMinutes" label="Time" onSort={handleSort} sortKey={sortKey} sortDir={sortDir} Icon={SortIcon} className="text-center" />}
                                        {visibleCols.has('complexity') && <SortableHead column="complexity" label="Complexity" onSort={handleSort} sortKey={sortKey} sortDir={sortDir} Icon={SortIcon} className="text-center" />}
                                        {visibleCols.has('rating') && <SortableHead column="rating" label="Rating" onSort={handleSort} sortKey={sortKey} sortDir={sortDir} Icon={SortIcon} className="text-center" />}
                                        {visibleCols.has('year') && <SortableHead column="yearPublished" label="Year" onSort={handleSort} sortKey={sortKey} sortDir={sortDir} Icon={SortIcon} className="text-center" />}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paged.map((game) => (
                                        <TableRow
                                            key={game.id}
                                            className={cn(
                                                'transition-colors',
                                                hoveredGame === game.name && 'bg-lime/10',
                                            )}
                                            onMouseEnter={() => setHoveredGame(game.name)}
                                            onMouseLeave={() => setHoveredGame(null)}
                                        >
                                            <TableCell className="w-[40px] text-center px-0">
                                                <input 
                                                    type="checkbox" 
                                                    className="accent-lime size-3.5 cursor-pointer align-middle"
                                                    checked={selectedIds.has(game.id)}
                                                    onChange={() => toggleSelection(game.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{game.name}</TableCell>
                                            {visibleCols.has('category') && (
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                        style={{
                                                            borderLeft: `3px solid ${CATEGORY_COLORS[game.category] ?? 'var(--border)'}`,
                                                        }}
                                                    >
                                                        {game.category}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            {visibleCols.has('players') && (
                                                <TableCell className="text-center text-muted-foreground">
                                                    {game.minPlayers === game.maxPlayers
                                                        ? game.minPlayers
                                                        : `${game.minPlayers}–${game.maxPlayers}`}
                                                </TableCell>
                                            )}
                                            {visibleCols.has('time') && (
                                                <TableCell className="text-center text-muted-foreground">
                                                    {game.playTimeMinutes}m
                                                </TableCell>
                                            )}
                                            {visibleCols.has('complexity') && (
                                                <TableCell className="text-center">
                                                    <ComplexityDots value={game.complexity} />
                                                </TableCell>
                                            )}
                                            {visibleCols.has('rating') && (
                                                <TableCell className="text-center">
                                                    <span className="font-semibold text-lime">{game.rating}</span>
                                                </TableCell>
                                            )}
                                            {visibleCols.has('year') && (
                                                <TableCell className="text-center text-muted-foreground">
                                                    {game.yearPublished}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Floating Action Bar */}
                            {selectedIds.size > 0 && data.onAction && (
                                <div className="absolute bottom-0 left-0 right-0 bg-secondary/95 backdrop-blur border-t border-border p-2.5 flex items-center justify-between animate-in slide-in-from-bottom-2">
                                    <span className="text-xs font-medium text-muted-foreground ml-2">
                                        {selectedIds.size} {selectedIds.size === 1 ? 'game' : 'games'} selected
                                    </span>
                                    <Button size="sm" className="h-7 text-xs bg-lime text-lime-foreground hover:bg-lime/90" onClick={summarizeSelection}>
                                        <Sparkles className="size-3 mr-1.5" />
                                        Summarize
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Page {safePage + 1} of {totalPages}
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={safePage === 0}
                                    >
                                        <ChevronLeft className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-7"
                                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                        disabled={safePage >= totalPages - 1}
                                    >
                                        <ChevronRight className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SortableHead({
    column,
    label,
    onSort,
    sortKey,
    sortDir,
    Icon,
    className,
}: {
    column: SortKey
    label: string
    onSort: (key: SortKey) => void
    sortKey: SortKey
    sortDir: SortDir
    Icon: React.ComponentType<{ column: SortKey }>
    className?: string
}) {
    return (
        <TableHead
            className={cn('cursor-pointer select-none hover:text-foreground transition-colors', className)}
            onClick={() => onSort(column)}
        >
            {label}
            <Icon column={column} />
        </TableHead>
    )
}

function ComplexityDots({ value }: { value: number }) {
    const filled = Math.round(value)
    return (
        <span className="inline-flex gap-0.5" title={`${value}/5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <span
                    key={i}
                    className={cn(
                        'size-1.5 rounded-full',
                        i <= filled ? 'bg-lime' : 'bg-muted-foreground/20',
                    )}
                />
            ))}
        </span>
    )
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

export function GamesExplorerSkeleton() {
    return (
        <Card className="w-full max-w-2xl py-0 overflow-hidden">
            <CardHeader className="px-5 py-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12 rounded-md" />
                </div>
                <Skeleton className="mt-1 h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-4">
                <Skeleton className="h-9 w-full rounded-md" />
                {/* Chart skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-[180px] w-full rounded-lg" />
                    <Skeleton className="h-[180px] w-full rounded-lg" />
                </div>
                {/* Table skeleton */}
                <div className="space-y-2 rounded-lg border border-border p-3">
                    <Skeleton className="h-8 w-full" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

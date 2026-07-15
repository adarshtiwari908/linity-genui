import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
    title: 'Linity · Generative UI Challenge',
    description: 'A take-home challenge: build a generative UI feature with the Vercel AI SDK.',
}

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}

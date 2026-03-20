'use client'

import { useEffect, useState } from 'react'

interface AppStatus {
  name: string
  url: string
  ok: boolean
  statusCode: number | null
  responseMs: number | null
  error?: string
}

interface AppsData {
  apps: AppStatus[]
  upcomingConcerts: number | null
  concertError?: string
}

function AppCard({ app, extra }: { app: AppStatus; extra?: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              app.ok ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span className="text-zinc-200 text-sm font-medium truncate">{app.name}</span>
        </div>
        <span
          className={`text-xs font-mono flex-shrink-0 ${
            app.ok ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {app.ok ? 'UP' : 'DOWN'}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        {app.statusCode && <span>HTTP {app.statusCode}</span>}
        {app.responseMs !== null && <span>{app.responseMs}ms</span>}
        {app.error && <span className="text-red-400 truncate">{app.error}</span>}
      </div>
      {extra}
    </div>
  )
}

export default function AppsWidget() {
  const [data, setData] = useState<AppsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/apps')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
      <h2 className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
        App Status
      </h2>

      {loading && <div className="text-zinc-600 text-sm animate-pulse">Loading...</div>}

      {!loading && data && (
        <div className="space-y-2">
          {data.apps.map((app) => {
            const isConcerts = app.name === 'concerts.redeye.dev'
            const extra = isConcerts ? (
              <div className="text-xs text-zinc-500">
                {data.concertError ? (
                  <span className="text-amber-400">{data.concertError}</span>
                ) : data.upcomingConcerts !== null ? (
                  <span>
                    🎸{' '}
                    <span className="text-zinc-300">{data.upcomingConcerts}</span> upcoming events
                  </span>
                ) : null}
              </div>
            ) : undefined
            return <AppCard key={app.name} app={app} extra={extra} />
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

interface Pm2Process {
  name: string
  status: string
  uptime: number | null
  memory: number
  restarts: number
  pid: number | null
}

interface InfraData {
  pm2: Pm2Process[]
  cpu: number | null
  memTotal: number | null
  memUsed: number | null
  memPercent: number | null
  diskPercent: number | null
  error?: string
}

function formatUptime(ms: number | null): string {
  if (ms === null) return '—'
  const now = Date.now()
  const upSince = new Date(ms)
  const diffMs = now - upSince.getTime()
  if (diffMs < 0) return '—'
  const secs = Math.floor(diffMs / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function formatMem(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${Math.round(bytes / 1024 / 1024)}MB`
}

function StatusBadge({ status }: { status: string }) {
  const isOnline = status === 'online'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
        isOnline
          ? 'bg-green-900/50 text-green-400 border border-green-800'
          : 'bg-red-900/50 text-red-400 border border-red-800'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}
      />
      {status}
    </span>
  )
}

function StatCard({
  label,
  value,
  unit,
  warn,
}: {
  label: string
  value: number | null
  unit?: string
  warn?: boolean
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col gap-1">
      <span className="text-zinc-500 text-xs uppercase tracking-wide">{label}</span>
      <span
        className={`text-2xl font-mono font-bold ${
          value === null ? 'text-zinc-600' : warn ? 'text-amber-400' : 'text-white'
        }`}
      >
        {value === null ? '—' : `${value}${unit ?? ''}`}
      </span>
    </div>
  )
}

export default function InfraWidget() {
  const [data, setData] = useState<InfraData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/infra')
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
        Infrastructure
      </h2>

      {loading && (
        <div className="text-zinc-600 text-sm animate-pulse">Loading...</div>
      )}

      {!loading && data?.error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-900 rounded-lg p-3">
          {data.error}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="CPU" value={data.cpu} unit="%" warn={(data.cpu ?? 0) > 80} />
            <StatCard label="Memory" value={data.memPercent} unit="%" warn={(data.memPercent ?? 0) > 85} />
            <StatCard label="Disk" value={data.diskPercent} unit="%" warn={(data.diskPercent ?? 0) > 80} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs border-b border-zinc-800">
                  <th className="text-left pb-2 font-medium">Process</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-right pb-2 font-medium">Uptime</th>
                  <th className="text-right pb-2 font-medium">Memory</th>
                  <th className="text-right pb-2 font-medium">Restarts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {data.pm2.map((p) => (
                  <tr key={p.name} className="text-zinc-300">
                    <td className="py-2 font-mono text-xs">{p.name}</td>
                    <td className="py-2">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-zinc-400">
                      {formatUptime(p.uptime)}
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-zinc-400">
                      {formatMem(p.memory)}
                    </td>
                    <td
                      className={`py-2 text-right font-mono text-xs ${
                        p.restarts > 5 ? 'text-amber-400' : 'text-zinc-400'
                      }`}
                    >
                      {p.restarts}
                    </td>
                  </tr>
                ))}
                {data.pm2.length === 0 && !data.error && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-zinc-600 text-xs">
                      No processes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

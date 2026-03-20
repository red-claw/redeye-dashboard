'use client'

import { useEffect, useState } from 'react'

interface DnsEntry {
  domain: string
  provider: string
  expected: 'route53' | 'pending' | 'unknown'
  nameservers: string[]
  status: 'ok' | 'pending' | 'error'
  error?: string
}

interface SslEntry {
  domain: string
  validTo: string | null
  daysRemaining: number | null
  warning: boolean
  error?: string
}

interface SesEntry {
  identity: string
  region: string
  verificationStatus: string | null
  error?: string
}

interface StatusData {
  dns: DnsEntry[]
  ssl: SslEntry[]
  ses: SesEntry[]
}

function DnsStatusBadge({ status }: { status: 'ok' | 'pending' | 'error' }) {
  const styles = {
    ok: 'bg-green-900/50 text-green-400 border-green-800',
    pending: 'bg-amber-900/50 text-amber-400 border-amber-800',
    error: 'bg-red-900/50 text-red-400 border-red-800',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {status === 'ok' ? '✅ Route53' : status === 'pending' ? '⏳ Pending' : '❌ Error'}
    </span>
  )
}

function SesBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-zinc-600 text-xs">—</span>
  const ok = status === 'Success'
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
        ok
          ? 'bg-green-900/50 text-green-400 border-green-800'
          : 'bg-amber-900/50 text-amber-400 border-amber-800'
      }`}
    >
      {status}
    </span>
  )
}

export default function StatusWidget() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-5">
      <h2 className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
        Infrastructure Status
      </h2>

      {loading && <div className="text-zinc-600 text-sm animate-pulse">Loading...</div>}

      {!loading && data && (
        <>
          {/* DNS */}
          <div>
            <h3 className="text-zinc-400 text-xs font-medium mb-2">DNS Migration</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-xs border-b border-zinc-800">
                    <th className="text-left pb-2 font-medium">Domain</th>
                    <th className="text-left pb-2 font-medium">Provider</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {data.dns.map((entry) => (
                    <tr key={entry.domain} className="text-zinc-300">
                      <td className="py-2 font-mono text-xs">{entry.domain}</td>
                      <td className="py-2 text-zinc-400 text-xs">{entry.provider}</td>
                      <td className="py-2">
                        <DnsStatusBadge status={entry.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SSL */}
          <div>
            <h3 className="text-zinc-400 text-xs font-medium mb-2">SSL Certificates</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-xs border-b border-zinc-800">
                    <th className="text-left pb-2 font-medium">Domain</th>
                    <th className="text-left pb-2 font-medium">Expires</th>
                    <th className="text-right pb-2 font-medium">Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {data.ssl.map((entry) => (
                    <tr key={entry.domain} className="text-zinc-300">
                      <td className="py-2 font-mono text-xs">{entry.domain}</td>
                      <td className="py-2 text-xs text-zinc-400">
                        {entry.error ? (
                          <span className="text-red-400">{entry.error}</span>
                        ) : entry.validTo ? (
                          new Date(entry.validTo).toLocaleDateString()
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        className={`py-2 text-right font-mono text-xs ${
                          entry.warning
                            ? 'text-amber-400 font-bold'
                            : entry.daysRemaining !== null
                            ? 'text-green-400'
                            : 'text-zinc-600'
                        }`}
                      >
                        {entry.daysRemaining !== null ? (
                          <>
                            {entry.daysRemaining}d{entry.warning && ' ⚠️'}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SES */}
          <div>
            <h3 className="text-zinc-400 text-xs font-medium mb-2">SES Verification</h3>
            <div className="space-y-1">
              {data.ses.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <div>
                    <span className="font-mono text-xs text-zinc-300">{entry.identity}</span>
                    <span className="text-zinc-600 text-xs ml-2">({entry.region})</span>
                  </div>
                  {entry.error ? (
                    <span className="text-red-400 text-xs">{entry.error}</span>
                  ) : (
                    <SesBadge status={entry.verificationStatus} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

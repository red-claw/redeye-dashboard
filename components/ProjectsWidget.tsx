'use client'

import { useEffect, useState } from 'react'

interface PullRequest {
  repo: string
  number: number
  title: string
  url: string
  createdAt: string
  ageHours: number
  author: string
}

interface LinearIssue {
  id: string
  title: string
  project: string | null
  url: string
  state: string
  priority: number
}

interface ProjectsData {
  pullRequests: PullRequest[]
  linearIssues: LinearIssue[]
  errors: string[]
}

function PriorityDot({ priority }: { priority: number }) {
  const colors: Record<number, string> = {
    1: 'bg-red-500',
    2: 'bg-orange-400',
    3: 'bg-yellow-400',
    4: 'bg-zinc-500',
  }
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors[priority] ?? 'bg-zinc-700'}`}
      title={['', 'Urgent', 'High', 'Medium', 'Low'][priority] ?? 'No priority'}
    />
  )
}

export default function ProjectsWidget() {
  const [data, setData] = useState<ProjectsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
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
        Projects
      </h2>

      {loading && <div className="text-zinc-600 text-sm animate-pulse">Loading...</div>}

      {!loading && data && (
        <>
          {data.errors.length > 0 && (
            <div className="space-y-1">
              {data.errors.map((e, i) => (
                <div key={i} className="text-red-400 text-xs bg-red-900/20 border border-red-900 rounded px-3 py-1">
                  {e}
                </div>
              ))}
            </div>
          )}

          {/* Pull Requests */}
          <div>
            <h3 className="text-zinc-400 text-xs font-medium mb-2 flex items-center gap-2">
              <span>Open Pull Requests</span>
              {data.pullRequests.length > 0 && (
                <span className="bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded text-xs">
                  {data.pullRequests.length}
                </span>
              )}
            </h3>
            {data.pullRequests.length === 0 ? (
              <p className="text-zinc-600 text-xs">No open PRs</p>
            ) : (
              <div className="space-y-2">
                {data.pullRequests.map((pr) => (
                  <div
                    key={`${pr.repo}#${pr.number}`}
                    className="flex items-start justify-between gap-2 bg-zinc-900 rounded-lg px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-200 text-sm hover:text-amber-400 transition-colors truncate block"
                      >
                        {pr.title}
                      </a>
                      <div className="text-zinc-500 text-xs mt-0.5">
                        {pr.repo}#{pr.number} · {pr.author}
                      </div>
                    </div>
                    <span
                      className={`text-xs flex-shrink-0 ${
                        pr.ageHours > 72 ? 'text-amber-400' : 'text-zinc-500'
                      }`}
                    >
                      {pr.ageHours}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linear Issues */}
          <div>
            <h3 className="text-zinc-400 text-xs font-medium mb-2 flex items-center gap-2">
              <span>Linear In-Progress</span>
              {data.linearIssues.length > 0 && (
                <span className="bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded text-xs">
                  {data.linearIssues.length}
                </span>
              )}
            </h3>
            {data.linearIssues.length === 0 ? (
              <p className="text-zinc-600 text-xs">No in-progress issues</p>
            ) : (
              <div className="space-y-2">
                {data.linearIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2"
                  >
                    <PriorityDot priority={issue.priority} />
                    <div className="min-w-0 flex-1">
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-200 text-sm hover:text-amber-400 transition-colors truncate block"
                      >
                        {issue.title}
                      </a>
                      <div className="text-zinc-500 text-xs mt-0.5">
                        {issue.project ?? 'No project'} · {issue.state}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

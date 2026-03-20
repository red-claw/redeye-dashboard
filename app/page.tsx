import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import InfraWidget from '@/components/InfraWidget'
import ProjectsWidget from '@/components/ProjectsWidget'
import AppsWidget from '@/components/AppsWidget'
import StatusWidget from '@/components/StatusWidget'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <main
      className="min-h-screen p-6"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400 tracking-tight">
              redeye dashboard
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-sm">{session.user?.email}</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfraWidget />
          <ProjectsWidget />
          <AppsWidget />
          <StatusWidget />
        </div>
      </div>
    </main>
  )
}

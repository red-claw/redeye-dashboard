import { execSync } from 'node:child_process'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

function run(cmd: string): string {
  return execSync(cmd, { timeout: 10000, encoding: 'utf8' })
}

export async function GET(): Promise<NextResponse<InfraData | { error: string }>> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // PM2
    const pm2Raw = run('pm2 jlist')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pm2Json: any[] = JSON.parse(pm2Raw)
    const pm2: Pm2Process[] = pm2Json.map((p) => ({
      name: p.name,
      status: p.pm2_env?.status ?? 'unknown',
      uptime: p.pm2_env?.pm_uptime ?? null,
      memory: p.monit?.memory ?? 0,
      restarts: p.pm2_env?.restart_time ?? 0,
      pid: p.pid ?? null,
    }))

    // Memory
    const memRaw = run('free -m')
    let memTotal: number | null = null
    let memUsed: number | null = null
    let memPercent: number | null = null
    const memLines = memRaw.split('\n')
    for (const line of memLines) {
      if (line.startsWith('Mem:')) {
        const parts = line.trim().split(/\s+/)
        memTotal = parseInt(parts[1], 10)
        memUsed = parseInt(parts[2], 10)
        if (memTotal && memUsed) {
          memPercent = Math.round((memUsed / memTotal) * 100)
        }
        break
      }
    }

    // Disk
    const diskRaw = run('df -h /')
    let diskPercent: number | null = null
    const diskLines = diskRaw.split('\n')
    for (const line of diskLines) {
      if (line.includes('/') && !line.startsWith('Filesystem')) {
        const parts = line.trim().split(/\s+/)
        const pct = parts[4]?.replace('%', '')
        if (pct) diskPercent = parseInt(pct, 10)
        break
      }
    }

    // CPU
    const cpuRaw = run("top -bn1 | grep 'Cpu(s)'")
    let cpu: number | null = null
    // e.g. "%Cpu(s):  5.9 us,  1.2 sy,  0.0 ni, 91.8 id, ..."
    const idleMatch = cpuRaw.match(/(\d+\.?\d*)\s*id/)
    if (idleMatch) {
      cpu = Math.round(100 - parseFloat(idleMatch[1]))
    }

    return NextResponse.json({ pm2, cpu, memTotal, memUsed, memPercent, diskPercent })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { pm2: [], cpu: null, memTotal: null, memUsed: null, memPercent: null, diskPercent: null, error },
      { status: 500 }
    )
  }
}

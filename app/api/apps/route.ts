import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

async function pingApp(name: string, url: string, expectedJson?: boolean): Promise<AppStatus> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timeout)
    const responseMs = Date.now() - start
    let ok = res.ok
    if (expectedJson) {
      try {
        const json = await res.json()
        ok = json?.ok === true
      } catch {
        ok = false
      }
    }
    return { name, url, ok, statusCode: res.status, responseMs }
  } catch (err) {
    return {
      name,
      url,
      ok: false,
      statusCode: null,
      responseMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function countUpcomingConcerts(): Promise<{ count: number | null; error?: string }> {
  const icalUrl =
    process.env.ICAL_FEED_URL ||
    'https://p182-caldav.icloud.com/published/2/MTY5NjEyMTY1MDE2OTYxMg4rjh18ZVg2KnXzEWI8oCaJMyb59REE96gmmWFn_AZ9PPgJKFl01njsMHAulbgB3XCuc5_1uwmUbCDVzEvkfRc'

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(icalUrl, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timeout)
    if (!res.ok) return { count: null, error: `iCal fetch failed: ${res.status}` }
    const text = await res.text()
    const now = new Date()
    const nowStr = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    // Extract all DTSTART values
    const dtStartMatches = [...text.matchAll(/DTSTART[^:]*:(\d{8}T?\d*Z?)/g)]
    let count = 0
    for (const m of dtStartMatches) {
      const raw = m[1]
      // Normalize to comparable string: YYYYMMDDTHHMMSSZ or YYYYMMDD
      const normalized = raw.length === 8 ? raw + 'T000000Z' : raw
      if (normalized >= nowStr) count++
    }
    return { count }
  } catch (err) {
    return { count: null, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function GET(): Promise<NextResponse<AppsData>> {
  const [modsStatus, happyHourStatus, concertsStatus, concertData] = await Promise.all([
    pingApp('mods.redeye.dev', 'https://mods.redeye.dev/health', true),
    pingApp('happyhour.redeye.dev', 'https://happyhour.redeye.dev/'),
    pingApp('concerts.redeye.dev', 'https://concerts.redeye.dev/'),
    countUpcomingConcerts(),
  ])

  return NextResponse.json({
    apps: [modsStatus, happyHourStatus, concertsStatus],
    upcomingConcerts: concertData.count,
    concertError: concertData.error,
  })
}

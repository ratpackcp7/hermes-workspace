import { createFileRoute } from '@tanstack/react-router'
import { readFile } from 'node:fs/promises'
import { isAuthenticated } from '../../server/auth-middleware'

type CronJobRow = {
  id?: string
  name?: string
  enabled?: boolean
  schedule?: unknown
  last_run_at?: string | null
  last_status?: string | null
  last_error?: string | null
  lastRun?: {
    startedAt?: string | null
    status?: string | null
    error?: string | null
  }
}

type BobMaintenancePayload = {
  ok: boolean
  generatedAt: string
  jobs: {
    total: number
    enabled: number
    failedLastRun: number
    neverRun: number
    docsDriftJobPresent: boolean
    docsDriftJobEnabled: boolean
  }
  diagnostics: string[]
  runbooks: string[]
  error?: string
}

const JOBS_PATH = '/home/chris/.hermes/cron/jobs.json'

const diagnostics = [
  '/home/chris/cp7-bridge/scripts/bob-health.sh',
  '/home/chris/scripts/cron-health.py',
  '/home/chris/scripts/bob-docs-drift-check.py',
  '/home/chris/scripts/bob-maintenance-preflight.sh',
]

const runbooks = [
  '/home/chris/wiki/projects/hermes-known-good-state.md',
  '/home/chris/wiki/runbooks/hermes-known-failures.md',
  '/home/chris/wiki/concepts/bob-operating-model.md',
  '/home/chris/wiki/projects/bob-improvement-backlog.md',
]

function normalizeJobs(raw: unknown): CronJobRow[] {
  if (Array.isArray(raw)) return raw.filter(isRecord) as CronJobRow[]
  if (isRecord(raw) && Array.isArray(raw.jobs)) {
    return raw.jobs.filter(isRecord) as CronJobRow[]
  }
  return []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function lastStatus(job: CronJobRow): string {
  return String(job.last_status ?? job.lastRun?.status ?? '').toLowerCase()
}

function hasRun(job: CronJobRow): boolean {
  return Boolean(job.last_run_at || job.lastRun?.startedAt)
}

async function buildPayload(): Promise<BobMaintenancePayload> {
  const raw = JSON.parse(await readFile(JOBS_PATH, 'utf8')) as unknown
  const jobs = normalizeJobs(raw)
  const enabledJobs = jobs.filter((job) => job.enabled !== false)
  const failedLastRun = enabledJobs.filter((job) => {
    const status = lastStatus(job)
    return status === 'error' || status.includes('fail')
  })
  const neverRun = enabledJobs.filter((job) => !hasRun(job))
  const docsDriftJob = enabledJobs.find(
    (job) => job.name === 'bob-docs-drift-check',
  )

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    jobs: {
      total: jobs.length,
      enabled: enabledJobs.length,
      failedLastRun: failedLastRun.length,
      neverRun: neverRun.length,
      docsDriftJobPresent: Boolean(docsDriftJob),
      docsDriftJobEnabled: Boolean(docsDriftJob && docsDriftJob.enabled !== false),
    },
    diagnostics,
    runbooks,
  }
}

export const Route = createFileRoute('/api/bob-maintenance')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthenticated(request)) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        try {
          return new Response(JSON.stringify(await buildPayload()), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          const payload: BobMaintenancePayload = {
            ok: false,
            generatedAt: new Date().toISOString(),
            jobs: {
              total: 0,
              enabled: 0,
              failedLastRun: 0,
              neverRun: 0,
              docsDriftJobPresent: false,
              docsDriftJobEnabled: false,
            },
            diagnostics,
            runbooks,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
          return new Response(JSON.stringify(payload), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})

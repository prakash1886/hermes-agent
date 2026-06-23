import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sessionCommands } from '../app/slash/commands/session.js'
import type { SessionUsageResponse } from '../gatewayTypes.js'

const usageCommand = sessionCommands.find(cmd => cmd.name === 'usage')!

const USAGE_CTA = 'Run /subscription to change plan · /topup to add credits'

const guarded =
  <T>(fn: (r: T) => void) =>
  (r: null | T) => {
    if (r) {
      fn(r)
    }
  }

/** Build a ctx whose rpc routes by method name to a supplied map of results. */
const buildCtx = (results: Record<string, unknown>) => {
  const sys = vi.fn()
  const panel = vi.fn()

  const rpc = vi.fn((method: string, _params: unknown) => {
    return Promise.resolve(results[method])
  })

  const ctx = {
    gateway: { rpc },
    guarded,
    guardedErr: vi.fn(),
    sid: 'sid-1',
    stale: () => false,
    transcript: { page: vi.fn(), panel, sys }
  }

  const run = async (arg: string) => {
    usageCommand.run(arg, ctx as any, 'usage')
    await rpc.mock.results[0]?.value
    await Promise.resolve()
    await Promise.resolve()
  }

  return { ctx, panel, run, sys }
}

const baseUsage = (overrides: Partial<SessionUsageResponse> = {}): SessionUsageResponse =>
  ({
    calls: 0,
    input: 0,
    output: 0,
    total: 0,
    ...overrides
  }) as SessionUsageResponse

const printed = (sys: ReturnType<typeof vi.fn>) => sys.mock.calls.map(c => c[0]).join('\n')

describe('/usage slash command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('appends the CTA in the with-calls render (healthy path)', async () => {
    const { run, sys } = buildCtx({
      'session.usage': baseUsage({
        calls: 12,
        input: 1000,
        output: 500,
        total: 1500,
        model: 'test-model',
        credits_lines: ['$50.00 remaining']
      })
    })

    await run('')

    expect(printed(sys)).toContain(USAGE_CTA)
  })

  it('appends the CTA in the no-calls render (depleted/empty path)', async () => {
    const { run, sys } = buildCtx({
      'session.usage': baseUsage({ calls: 0, credits_lines: [] })
    })

    await run('')

    expect(printed(sys)).toContain('no API calls yet')
    expect(printed(sys)).toContain(USAGE_CTA)
  })

  it('appends the CTA when credits exist but there are no calls', async () => {
    const { run, sys } = buildCtx({
      'session.usage': baseUsage({ calls: 0, credits_lines: ['$50.00 remaining'] })
    })

    await run('')

    expect(printed(sys)).toContain(USAGE_CTA)
    expect(printed(sys)).not.toContain('no API calls yet')
  })
})

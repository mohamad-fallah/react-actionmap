import { describe, expect, it, vi } from 'vitest'
import type { ActionDefinition } from '../src/core/types.js'
import { executeAction } from '../src/core/execute-action.js'

describe('executeAction', () => {
  it('confirms before running a confirmed action', async () => {
    const run = vi.fn()
    const confirm = vi.fn().mockResolvedValue(true)
    const action: ActionDefinition<object> = {
      id: 'users.delete',
      label: 'Delete user',
      confirm: { title: 'Delete user?' },
      run,
    }

    await executeAction({ action, context: {}, confirm })

    expect(confirm).toHaveBeenCalledWith({ title: 'Delete user?' })
    expect(run).toHaveBeenCalledOnce()
  })

  it('does not run when confirmation is declined', async () => {
    const run = vi.fn()
    const action: ActionDefinition<object> = {
      id: 'users.delete',
      label: 'Delete user',
      confirm: { title: 'Delete user?' },
      run,
    }

    await executeAction({
      action,
      context: {},
      confirm: () => false,
    })

    expect(run).not.toHaveBeenCalled()
  })

  it('runs first and navigates second for href actions', async () => {
    const calls: string[] = []
    const action: ActionDefinition<object> = {
      id: 'users.save-and-view',
      label: 'Save and view',
      run: () => {
        calls.push('run')
      },
      href: '/users/1',
    }

    await executeAction({
      action,
      context: {},
      navigate: (href) => calls.push(`navigate:${href}`),
    })

    expect(calls).toEqual(['run', 'navigate:/users/1'])
  })
})

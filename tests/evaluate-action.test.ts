import { describe, expect, it } from 'vitest'
import type { ActionDefinition } from '../src/core/types.js'
import { evaluateAction } from '../src/core/evaluate-action.js'
import { canRunAction } from '../src/permissions/can-run-action.js'

type TestContext = {
  readonly selected: boolean
  readonly locked: boolean
}

const action: ActionDefinition<TestContext> = {
  id: 'records.delete',
  label: 'Delete record',
  permission: ['records.read', 'records.delete'],
  when: (context) => context.selected,
  disabled: (context) => context.locked,
  disabledReason: 'Locked records cannot be deleted',
  run: () => undefined,
}

describe('action evaluation', () => {
  it('requires every declared permission', () => {
    const context = { selected: true, locked: false }

    expect(
      canRunAction(action, ['records.read', 'records.delete'], context),
    ).toBe(true)
    expect(canRunAction(action, ['records.read'], context)).toBe(false)
    expect(
      canRunAction(
        action,
        (permission) => permission !== 'records.delete',
        context,
      ),
    ).toBe(false)
  })

  it('hides actions that fail when or hidden conditions', () => {
    expect(
      evaluateAction(
        action,
        { selected: false, locked: false },
        ['records.read', 'records.delete'],
      ).hidden,
    ).toBe(true)

    const explicitlyHidden: ActionDefinition<TestContext> = {
      ...action,
      hidden: true,
    }
    expect(
      evaluateAction(
        explicitlyHidden,
        { selected: true, locked: false },
        ['records.read', 'records.delete'],
      ).hidden,
    ).toBe(true)
  })

  it('keeps disabled actions visible but not runnable', () => {
    const state = evaluateAction(
      action,
      { selected: true, locked: true },
      ['records.read', 'records.delete'],
    )

    expect(state.hidden).toBe(false)
    expect(state.disabled).toBe(true)
    expect(state.canRun).toBe(false)
    expect(state.disabledReason).toBe(
      'Locked records cannot be deleted',
    )
  })
})
